<?php
/**
 * Lesson Controller
 */
require_once __DIR__ . '/../models/Lesson.php';
require_once __DIR__ . '/../models/Module.php';
require_once __DIR__ . '/../models/Course.php';

class LessonController {
    private $lessonModel;
    private $moduleModel;
    private $courseModel;

    public function __construct() {
        $this->lessonModel = new Lesson();
        $this->moduleModel = new Module();
        $this->courseModel = new Course();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'module' && $id) {
                    $this->getByModule($id);
                } elseif ($action === 'course' && $id) {
                    $this->getByCourse($id);
                } elseif ($id) {
                    $this->getOne($id);
                } else {
                    Response::error('ID required', 400);
                }
                break;
            case 'POST':
                if ($action === 'complete' && $id) {
                    $this->markComplete($id);
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

    private function getByModule($moduleId) {
        $lessons = $this->lessonModel->findByModule($moduleId);
        Response::success($lessons);
    }

    private function getByCourse($courseId) {
        $lessons = $this->lessonModel->findByCourse($courseId);
        Response::success($lessons);
    }

    private function getOne($id) {
        $lesson = $this->lessonModel->findById($id);
        if ($lesson) {
            // Add progress if user is authenticated
            if (Auth::check()) {
                $progress = $this->lessonModel->getProgress(Auth::id(), $id);
                $lesson['is_completed'] = $progress ? $progress['is_completed'] : false;
            }
            Response::success($lesson);
        }
        Response::notFound('Lesson not found');
    }

    private function create() {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('module_id')->numeric('module_id')
            ->required('title')->minLength('title', 2)
            ->required('content_type')->in('content_type', ['video', 'pdf', 'text', 'quiz']);
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        // Verify module ownership
        $module = $this->moduleModel->findById($data['module_id']);
        if (!$module) {
            Response::notFound('Module not found');
        }
        
        $course = $this->courseModel->findById($module['course_id']);
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        $data = Validator::sanitizeArray($data);
        $lessonId = $this->lessonModel->create($data);
        
        if ($lessonId) {
            AuditLog::createLog('lessons', $lessonId, $data);
            $lesson = $this->lessonModel->findById($lessonId);
            Response::success($lesson, 'Lesson created successfully', 201);
        }
        
        Response::error('Failed to create lesson', 500);
    }

    private function update($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $lesson = $this->lessonModel->findById($id);
        if (!$lesson) {
            Response::notFound('Lesson not found');
        }

        $module = $this->moduleModel->findById($lesson['module_id']);
        $course = $this->courseModel->findById($module['course_id']);
        
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeArray($data);
        
        if ($this->lessonModel->update($id, $data)) {
            AuditLog::updateLog('lessons', $id, $lesson, $data);
            $updated = $this->lessonModel->findById($id);
            Response::success($updated, 'Lesson updated successfully');
        }
        
        Response::error('Failed to update lesson', 500);
    }

    private function delete($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $lesson = $this->lessonModel->findById($id);
        if (!$lesson) {
            Response::notFound('Lesson not found');
        }

        $module = $this->moduleModel->findById($lesson['module_id']);
        $course = $this->courseModel->findById($module['course_id']);
        
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        if ($this->lessonModel->delete($id)) {
            AuditLog::deleteLog('lessons', $id, $lesson);
            Response::success(null, 'Lesson deleted successfully');
        }
        
        Response::error('Failed to delete lesson', 500);
    }

    private function markComplete($id) {
        Auth::requireAuth();
        
        $lesson = $this->lessonModel->findById($id);
        if (!$lesson) {
            Response::notFound('Lesson not found');
        }

        if ($this->lessonModel->markComplete(Auth::id(), $id)) {
            Response::success(null, 'Lesson marked as complete');
        }
        
        Response::error('Failed to mark lesson complete', 500);
    }
}
?>
