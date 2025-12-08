<?php
/**
 * Test enrollment debugging script
 */

session_start();

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/Auth.php';
require_once __DIR__ . '/models/Course.php';
require_once __DIR__ . '/models/Enrollment.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    die("ERROR: Not logged in. Please log in first.");
}

$userId = $_SESSION['user_id'];
$courseId = isset($_GET['course_id']) ? (int)$_GET['course_id'] : null;

if (!$courseId) {
    die("ERROR: No course_id provided. Add ?course_id=X to the URL");
}

echo "<h2>Enrollment Debug Test</h2>";
echo "<p><strong>User ID:</strong> $userId</p>";
echo "<p><strong>Course ID:</strong> $courseId</p>";
echo "<hr>";

try {
    $courseModel = new Course();
    $enrollmentModel = new Enrollment();
    
    // Step 1: Check if course exists
    echo "<h3>Step 1: Checking if course exists...</h3>";
    $course = $courseModel->findById($courseId);
    if (!$course) {
        echo "<p style='color: red;'>❌ FAILED: Course not found</p>";
        exit;
    }
    echo "<p style='color: green;'>✓ Course found: {$course['title']}</p>";
    echo "<p>Status: {$course['status']}</p>";
    
    // Step 2: Check if course is published
    echo "<h3>Step 2: Checking if course is published...</h3>";
    if ($course['status'] !== 'published') {
        echo "<p style='color: red;'>❌ FAILED: Course is not published (status: {$course['status']})</p>";
        echo "<p>Only published courses can be enrolled in.</p>";
        exit;
    }
    echo "<p style='color: green;'>✓ Course is published</p>";
    
    // Step 3: Check if already enrolled
    echo "<h3>Step 3: Checking if already enrolled...</h3>";
    $isEnrolled = $enrollmentModel->isEnrolled($userId, $courseId);
    if ($isEnrolled) {
        echo "<p style='color: orange;'>⚠ Already enrolled in this course</p>";
        exit;
    }
    echo "<p style='color: green;'>✓ Not enrolled yet</p>";
    
    // Step 4: Check max students
    echo "<h3>Step 4: Checking course capacity...</h3>";
    if ($course['max_students']) {
        $enrollments = $enrollmentModel->findByCourse($courseId);
        $currentCount = count($enrollments);
        echo "<p>Current enrollments: $currentCount / {$course['max_students']}</p>";
        if ($currentCount >= $course['max_students']) {
            echo "<p style='color: red;'>❌ FAILED: Course is full</p>";
            exit;
        }
    } else {
        echo "<p>No enrollment limit</p>";
    }
    echo "<p style='color: green;'>✓ Course has space available</p>";
    
    // Step 5: Try to enroll
    echo "<h3>Step 5: Attempting to enroll...</h3>";
    $enrollId = $enrollmentModel->create($userId, $courseId);
    
    if ($enrollId) {
        echo "<p style='color: green; font-size: 18px; font-weight: bold;'>✓✓✓ SUCCESS! Enrolled with ID: $enrollId</p>";
        $enrollment = $enrollmentModel->findById($enrollId);
        echo "<pre>" . print_r($enrollment, true) . "</pre>";
    } else {
        echo "<p style='color: red;'>❌ FAILED: Database error during enrollment</p>";
        $db = Database::getInstance()->getConnection();
        echo "<p>Check your database connection and enrollments table structure.</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>EXCEPTION: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>
