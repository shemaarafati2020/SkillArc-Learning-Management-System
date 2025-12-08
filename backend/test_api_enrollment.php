<?php
/**
 * Direct API Enrollment Test
 * This simulates what the frontend does
 */

// Start session to maintain authentication
session_start();

// Set headers
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Not logged in. Please log in first.',
        'session_data' => $_SESSION
    ]);
    exit;
}

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/Auth.php';
require_once __DIR__ . '/models/Course.php';
require_once __DIR__ . '/models/Enrollment.php';

$courseId = isset($_GET['course_id']) ? (int)$_GET['course_id'] : null;

if (!$courseId) {
    echo json_encode([
        'success' => false,
        'error' => 'No course_id provided. Add ?course_id=X to URL'
    ]);
    exit;
}

try {
    $userId = $_SESSION['user_id'];
    $courseModel = new Course();
    $enrollmentModel = new Enrollment();
    
    // Step-by-step enrollment process
    $result = [
        'user_id' => $userId,
        'course_id' => $courseId,
        'steps' => []
    ];
    
    // Step 1: Check if course exists
    $course = $courseModel->findById($courseId);
    if (!$course) {
        $result['steps'][] = ['step' => 1, 'name' => 'Check course exists', 'status' => 'FAILED', 'message' => 'Course not found'];
        $result['success'] = false;
        $result['error'] = 'Course not found';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit;
    }
    $result['steps'][] = ['step' => 1, 'name' => 'Check course exists', 'status' => 'PASSED', 'course_title' => $course['title']];
    
    // Step 2: Check if course is published
    if ($course['status'] !== 'published') {
        $result['steps'][] = ['step' => 2, 'name' => 'Check if published', 'status' => 'FAILED', 'message' => 'Course is not published', 'current_status' => $course['status']];
        $result['success'] = false;
        $result['error'] = 'Course is not available for enrollment (status: ' . $course['status'] . ')';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit;
    }
    $result['steps'][] = ['step' => 2, 'name' => 'Check if published', 'status' => 'PASSED'];
    
    // Step 3: Check if already enrolled
    $isEnrolled = $enrollmentModel->isEnrolled($userId, $courseId);
    if ($isEnrolled) {
        $result['steps'][] = ['step' => 3, 'name' => 'Check if already enrolled', 'status' => 'FAILED', 'message' => 'Already enrolled'];
        $result['success'] = false;
        $result['error'] = 'Already enrolled in this course';
        echo json_encode($result, JSON_PRETTY_PRINT);
        exit;
    }
    $result['steps'][] = ['step' => 3, 'name' => 'Check if already enrolled', 'status' => 'PASSED'];
    
    // Step 4: Check max students
    if ($course['max_students']) {
        $enrollments = $enrollmentModel->findByCourse($courseId);
        $currentCount = count($enrollments);
        if ($currentCount >= $course['max_students']) {
            $result['steps'][] = ['step' => 4, 'name' => 'Check course capacity', 'status' => 'FAILED', 'message' => 'Course is full', 'current' => $currentCount, 'max' => $course['max_students']];
            $result['success'] = false;
            $result['error'] = 'Course is full';
            echo json_encode($result, JSON_PRETTY_PRINT);
            exit;
        }
        $result['steps'][] = ['step' => 4, 'name' => 'Check course capacity', 'status' => 'PASSED', 'current' => $currentCount, 'max' => $course['max_students']];
    } else {
        $result['steps'][] = ['step' => 4, 'name' => 'Check course capacity', 'status' => 'PASSED', 'message' => 'No limit'];
    }
    
    // Step 5: Attempt enrollment
    $enrollId = $enrollmentModel->create($userId, $courseId);
    
    if ($enrollId) {
        $result['steps'][] = ['step' => 5, 'name' => 'Create enrollment', 'status' => 'PASSED', 'enroll_id' => $enrollId];
        $result['success'] = true;
        $result['message'] = 'Successfully enrolled!';
        $result['enrollment_id'] = $enrollId;
    } else {
        $result['steps'][] = ['step' => 5, 'name' => 'Create enrollment', 'status' => 'FAILED', 'message' => 'Database error'];
        $result['success'] = false;
        $result['error'] = 'Failed to create enrollment record';
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Exception: ' . $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>
