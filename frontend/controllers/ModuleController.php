<?php
/**
 * Module Controller
 */
require_once __DIR__ . '/../models/Module.php';
require_once __DIR__ . '/../models/Course.php';

class ModuleController {
    private $moduleModel;
    private $courseModel;

    public function __construct() {
        $this->moduleModel = new Module();
        $this->courseModel = new Course();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'course' && $id) {
                    $this->getByCourse($id);
                } elseif ($id) {
                    $this->getOne($id);
                } else {
                    Response::error('Course ID required', 400);
                }
                break;
            case 'POST':
                if ($action === 'reorder') {
                    $this->reorder();
                } else {
                    $this->create();
                }
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
        $modules = $this->moduleModel->findByCourse($courseId);
        Response::success($modules);
    }

    private function getOne($id) {
        $module = $this->moduleModel->findById($id);
        if ($module) {
            Response::success($module);
        }
        Response::notFound('Module not found');
    }

    private function create() {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('course_id')->numeric('course_id')
            ->required('title')->minLength('title', 2);
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        // Verify course ownership
        $course = $this->courseModel->findById($data['course_id']);
        if (!$course) {
            Response::notFound('Course not found');
        }
        
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        $data = Validator::sanitizeArray($data);
        $moduleId = $this->moduleModel->create($data);
        
        if ($moduleId) {
            AuditLog::createLog('modules', $moduleId, $data);
            $module = $this->moduleModel->findById($moduleId);
            Response::success($module, 'Module created successfully', 201);
        }
        
        Response::error('Failed to create module', 500);
    }

    private function update($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $module = $this->moduleModel->findById($id);
        if (!$module) {
            Response::notFound('Module not found');
        }

        $course = $this->courseModel->findById($module['course_id']);
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeArray($data);
        
        if ($this->moduleModel->update($id, $data)) {
            AuditLog::updateLog('modules', $id, $module, $data);
            $updated = $this->moduleModel->findById($id);
            Response::success($updated, 'Module updated successfully');
        }
        
        Response::error('Failed to update module', 500);
    }

    private function delete($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $module = $this->moduleModel->findById($id);
        if (!$module) {
            Response::notFound('Module not found');
        }

        $course = $this->courseModel->findById($module['course_id']);
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        if ($this->moduleModel->delete($id)) {
            AuditLog::deleteLog('modules', $id, $module);
            Response::success(null, 'Module deleted successfully');
        }
        
        Response::error('Failed to delete module', 500);
    }

    private function reorder() {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['course_id']) || !isset($data['order'])) {
            Response::error('Course ID and order required', 400);
        }

        $course = $this->courseModel->findById($data['course_id']);
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        if ($this->moduleModel->reorder($data['course_id'], $data['order'])) {
            Response::success(null, 'Modules reordered successfully');
        }
        
        Response::error('Failed to reorder modules', 500);
    }
}
?>
