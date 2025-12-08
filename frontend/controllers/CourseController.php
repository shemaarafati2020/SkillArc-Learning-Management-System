<?php
/**
 * Course Controller
 */
require_once __DIR__ . '/../models/Course.php';

class CourseController {
    private $courseModel;

    public function __construct() {
        $this->courseModel = new Course();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                // Handle action keywords that might appear in the id position
                if ($id === 'my-courses' || $action === 'my-courses') {
                    $this->getMyCourses();
                } elseif ($id === 'categories' || $action === 'categories') {
                    $this->getCategories();
                } elseif ($id) {
                    $this->getOne($id);
                } else {
                    $this->getAll();
                }
                break;
            case 'POST':
                $this->create();
                break;
            case 'PUT':
                if ($id) $this->update($id);
                break;
            case 'DELETE':
                if ($id) $this->delete($id);
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function getAll() {
        $filters = [
            'status' => $_GET['status'] ?? null,
            'type' => $_GET['type'] ?? null,
            'category' => $_GET['category'] ?? null,
            'search' => $_GET['search'] ?? null,
            'instructor_id' => $_GET['instructor_id'] ?? null,
            'limit' => $_GET['limit'] ?? 50,
            'offset' => $_GET['offset'] ?? 0
        ];
        
        // Non-authenticated users can only see published courses
        if (!Auth::check()) {
            $filters['status'] = 'published';
        }
        
        $courses = $this->courseModel->findAll(array_filter($filters, fn($v) => $v !== null));
        $total = $this->courseModel->count($filters);
        
        Response::success([
            'courses' => $courses,
            'total' => $total
        ]);
    }

    private function getOne($id) {
        $course = $this->courseModel->findById($id);
        
        if (!$course) {
            Response::notFound('Course not found');
        }

        // Check access for non-published courses
        if ($course['status'] !== 'published') {
            Auth::requireAuth();
            if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
                Response::forbidden();
            }
        }

        Response::success($course);
    }

    private function getMyCourses() {
        Auth::requireAuth();
        
        $filters = ['instructor_id' => Auth::id()];
        $courses = $this->courseModel->findAll($filters);
        
        Response::success($courses);
    }

    private function getCategories() {
        $categories = $this->courseModel->getCategories();
        Response::success($categories);
    }

    private function create() {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('title')->minLength('title', 3)->maxLength('title', 200)
            ->required('description');
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        $data = Validator::sanitizeArray($data);
        $data['instructor_id'] = Auth::id();
        
        // Admins can set status directly
        if (!Auth::isAdmin()) {
            $data['status'] = 'draft';
        }
        
        $courseId = $this->courseModel->create($data);
        
        if ($courseId) {
            AuditLog::createLog('courses', $courseId, $data);
            $course = $this->courseModel->findById($courseId);
            Response::success($course, 'Course created successfully', 201);
        }
        
        Response::error('Failed to create course', 500);
    }

    private function update($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $course = $this->courseModel->findById($id);
        if (!$course) {
            Response::notFound('Course not found');
        }

        // Only owner or admin can update
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeArray($data);

        // Only admins can reassign instructor
        if (isset($data['instructor_id'])) {
            if (!Auth::isAdmin()) {
                unset($data['instructor_id']);
            } else {
                $data['instructor_id'] = (int)$data['instructor_id'];
            }
        }
        
        // Only admin can change status to published
        if (isset($data['status']) && $data['status'] === 'published' && !Auth::isAdmin()) {
            $data['status'] = 'pending';
        }
        
        if ($this->courseModel->update($id, $data)) {
            AuditLog::updateLog('courses', $id, $course, $data);
            $updatedCourse = $this->courseModel->findById($id);
            Response::success($updatedCourse, 'Course updated successfully');
        }
        
        Response::error('Failed to update course', 500);
    }

    private function delete($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $course = $this->courseModel->findById($id);
        if (!$course) {
            Response::notFound('Course not found');
        }

        // Only owner or admin can delete
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        if ($this->courseModel->delete($id)) {
            AuditLog::deleteLog('courses', $id, $course);
            Response::success(null, 'Course deleted successfully');
        }
        
        Response::error('Failed to delete course', 500);
    }
}
?>
