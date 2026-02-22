<?php
/**
 * Enrollment Controller
 */
require_once __DIR__ . '/../models/Enrollment.php';
require_once __DIR__ . '/../models/Course.php';

class EnrollmentController {
    private $enrollmentModel;
    private $courseModel;

    public function __construct() {
        $this->enrollmentModel = new Enrollment();
        $this->courseModel = new Course();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($id === 'my-enrollments') {
                    $this->getMyEnrollments();
                } elseif ($id === 'course' && $action) {
                    $this->getByCourse($action);
                } elseif ($id === 'check' && $action) {
                    $this->checkEnrollment($action);
                } elseif ($id && is_numeric($id)) {
                    $this->getOne($id);
                } else {
                    $this->getAll();
                }
                break;
            case 'POST':
                if ($id === 'enroll') {
                    $this->enroll();
                } elseif ($action === 'drop' || $id === 'drop') {
                    $courseId = $action ?: $id;
                    if (is_numeric($courseId)) {
                        $this->drop($courseId);
                    } else {
                        Response::error('Invalid course ID for drop', 400);
                    }
                } else {
                    Response::error('Invalid enrollment action', 400);
                }
                break;
            case 'PUT':
                if ($id && is_numeric($id)) $this->updateProgress($id);
                else Response::error('Invalid enrollment ID', 400);
                break;
            case 'DELETE':
                if ($id && is_numeric($id)) $this->delete($id);
                else Response::error('Invalid enrollment ID', 400);
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function getAll() {
        Auth::requireRole(['admin']);
        
        $filters = [
            'limit' => $_GET['limit'] ?? 1000,
            'offset' => $_GET['offset'] ?? 0
        ];
        
        $enrollments = $this->enrollmentModel->findAll(array_filter($filters, fn($v) => $v !== null));
        $total = $this->enrollmentModel->count();
        
        Response::success([
            'enrollments' => $enrollments,
            'total' => $total
        ]);
    }

    private function getMyEnrollments() {
        Auth::requireAuth();
        $enrollments = $this->enrollmentModel->findByUser(Auth::id());
        Response::success($enrollments);
    }

    private function getByCourse($courseId) {
        Auth::requireRole(['admin', 'instructor']);
        
        $course = $this->courseModel->findById($courseId);
        if (!$course) {
            Response::notFound('Course not found');
        }
        
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }
        
        $enrollments = $this->enrollmentModel->findByCourse($courseId);
        Response::success($enrollments);
    }

    private function getOne($id) {
        Auth::requireAuth();
        
        $enrollment = $this->enrollmentModel->findById($id);
        if ($enrollment) {
            Response::success($enrollment);
        }
        Response::notFound('Enrollment not found');
    }

    private function checkEnrollment($courseId) {
        Auth::requireAuth();
        
        $isEnrolled = $this->enrollmentModel->isEnrolled(Auth::id(), $courseId);
        Response::success(['is_enrolled' => $isEnrolled]);
    }

    private function enroll() {
        Auth::requireAuth();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        
        if (!isset($data['course_id'])) {
            Response::error('Course ID required', 400);
        }

        $courseId = (int)$data['course_id'];
        
        $course = $this->courseModel->findById($courseId);
        
        if (!$course) {
            Response::notFound('Course not found');
        }

        if ($course['status'] !== 'published') {
            Response::error('Course is not available for enrollment', 400);
        }

        // Check if already enrolled
        if ($this->enrollmentModel->isEnrolled(Auth::id(), $courseId)) {
            Response::error('Already enrolled in this course', 400);
        }

        // Check max students
        if ($course['max_students']) {
            $enrollments = $this->enrollmentModel->findByCourse($courseId);
            if (count($enrollments) >= $course['max_students']) {
                Response::error('Course is full', 400);
            }
        }

        $enrollId = $this->enrollmentModel->create(Auth::id(), $courseId);
        
        if ($enrollId) {
            AuditLog::createLog('enrollments', $enrollId, ['user_id' => Auth::id(), 'course_id' => $courseId]);
            $enrollment = $this->enrollmentModel->findById($enrollId);
            Response::success($enrollment, 'Enrolled successfully', 201);
        }
        
        Response::error('Failed to enroll', 500);
    }

    private function updateProgress($enrollId) {
        Auth::requireAuth();
        
        $enrollment = $this->enrollmentModel->findById($enrollId);
        if (!$enrollment) {
            Response::notFound('Enrollment not found');
        }

        // Calculate progress
        $progress = $this->enrollmentModel->calculateProgress($enrollment['user_id'], $enrollment['course_id']);
        $this->enrollmentModel->updateProgress($enrollment['user_id'], $enrollment['course_id'], $progress);
        
        // Check if completed
        if ($progress >= 100) {
            $this->enrollmentModel->complete($enrollment['user_id'], $enrollment['course_id']);
        }
        
        Response::success(['progress' => $progress], 'Progress updated');
    }

    private function drop($courseId) {
        Auth::requireAuth();
        
        if (!$this->enrollmentModel->isEnrolled(Auth::id(), $courseId)) {
            Response::error('Not enrolled in this course', 400);
        }

        if ($this->enrollmentModel->drop(Auth::id(), $courseId)) {
            AuditLog::log('DROP_COURSE', 'enrollments', null, null, ['user_id' => Auth::id(), 'course_id' => $courseId]);
            Response::success(null, 'Dropped from course successfully');
        }
        
        Response::error('Failed to drop course', 500);
    }

    private function delete($id) {
        Auth::requireRole(['admin']);
        
        $enrollment = $this->enrollmentModel->findById($id);
        if (!$enrollment) {
            Response::notFound('Enrollment not found');
        }

        if ($this->enrollmentModel->delete($id)) {
            AuditLog::deleteLog('enrollments', $id, $enrollment);
            Response::success(null, 'Enrollment deleted successfully');
        }
        
        Response::error('Failed to delete enrollment', 500);
    }
}
?>
