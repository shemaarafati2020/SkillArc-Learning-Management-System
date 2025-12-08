<?php
/**
 * Assignment Controller
 */
require_once __DIR__ . '/../models/Assignment.php';
require_once __DIR__ . '/../models/Course.php';

class AssignmentController {
    private $assignmentModel;
    private $courseModel;

    public function __construct() {
        $this->assignmentModel = new Assignment();
        $this->courseModel = new Course();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'course' && $id) {
                    $this->getByCourse($id);
                } elseif ($action === 'upcoming') {
                    $this->getUpcoming();
                } elseif ($id) {
                    $this->getOne($id);
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

    private function getByCourse($courseId) {
        $assignments = $this->assignmentModel->findByCourse($courseId);
        Response::success($assignments);
    }

    private function getUpcoming() {
        Auth::requireAuth();
        $assignments = $this->assignmentModel->findUpcoming(Auth::id());
        Response::success($assignments);
    }

    private function getOne($id) {
        $assignment = $this->assignmentModel->findById($id);
        if ($assignment) {
            Response::success($assignment);
        }
        Response::notFound('Assignment not found');
    }

    private function create() {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('course_id')->numeric('course_id')
            ->required('title')->minLength('title', 3);
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        $course = $this->courseModel->findById($data['course_id']);
        if (!$course) {
            Response::notFound('Course not found');
        }
        
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        $data = Validator::sanitizeArray($data);
        $assignId = $this->assignmentModel->create($data);
        
        if ($assignId) {
            AuditLog::createLog('assignments', $assignId, $data);
            $assignment = $this->assignmentModel->findById($assignId);
            Response::success($assignment, 'Assignment created successfully', 201);
        }
        
        Response::error('Failed to create assignment', 500);
    }

    private function update($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $assignment = $this->assignmentModel->findById($id);
        if (!$assignment) {
            Response::notFound('Assignment not found');
        }

        if (!Auth::isAdmin() && Auth::id() != $assignment['instructor_id']) {
            Response::forbidden();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeArray($data);
        
        if ($this->assignmentModel->update($id, $data)) {
            AuditLog::updateLog('assignments', $id, $assignment, $data);
            $updated = $this->assignmentModel->findById($id);
            Response::success($updated, 'Assignment updated successfully');
        }
        
        Response::error('Failed to update assignment', 500);
    }

    private function delete($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $assignment = $this->assignmentModel->findById($id);
        if (!$assignment) {
            Response::notFound('Assignment not found');
        }

        if (!Auth::isAdmin() && Auth::id() != $assignment['instructor_id']) {
            Response::forbidden();
        }

        if ($this->assignmentModel->delete($id)) {
            AuditLog::deleteLog('assignments', $id, $assignment);
            Response::success(null, 'Assignment deleted successfully');
        }
        
        Response::error('Failed to delete assignment', 500);
    }
}
?>
