<?php
/**
 * Submission Controller
 */
require_once __DIR__ . '/../models/Submission.php';
require_once __DIR__ . '/../models/Assignment.php';
require_once __DIR__ . '/../models/Course.php';

class SubmissionController {
    private $submissionModel;
    private $assignmentModel;
    private $courseModel;

    public function __construct() {
        $this->submissionModel = new Submission();
        $this->assignmentModel = new Assignment();
        $this->courseModel = new Course();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'assignment' && $id) {
                    $this->getByAssignment($id);
                } elseif ($action === 'my-submissions') {
                    $this->getMySubmissions();
                } elseif ($id) {
                    $this->getOne($id);
                }
                break;
            case 'POST':
                if ($action === 'grade' && $id) {
                    $this->grade($id);
                } else {
                    $this->submit();
                }
                break;
            case 'DELETE':
                if ($id) $this->delete($id);
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function getByAssignment($assignId) {
        Auth::requireRole(['admin', 'instructor']);
        
        $assignment = $this->assignmentModel->findById($assignId);
        if (!$assignment) {
            Response::notFound('Assignment not found');
        }

        if (!Auth::isAdmin() && Auth::id() != $assignment['instructor_id']) {
            Response::forbidden();
        }

        $submissions = $this->submissionModel->findByAssignment($assignId);
        Response::success($submissions);
    }

    private function getMySubmissions() {
        Auth::requireAuth();
        $submissions = $this->submissionModel->findByStudent(Auth::id());
        Response::success($submissions);
    }

    private function getOne($id) {
        Auth::requireAuth();
        
        $submission = $this->submissionModel->findById($id);
        if (!$submission) {
            Response::notFound('Submission not found');
        }

        // Check access
        $assignment = $this->assignmentModel->findById($submission['assign_id']);
        if (Auth::id() != $submission['student_id'] && 
            Auth::id() != $assignment['instructor_id'] && 
            !Auth::isAdmin()) {
            Response::forbidden();
        }

        Response::success($submission);
    }

    private function submit() {
        Auth::requireAuth();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['assign_id'])) {
            Response::error('Assignment ID required', 400);
        }

        $assignment = $this->assignmentModel->findById($data['assign_id']);
        if (!$assignment) {
            Response::notFound('Assignment not found');
        }

        // Check for duplicate rapid submission (fraud detection)
        if ($this->submissionModel->checkDuplicateSubmission($data['assign_id'], Auth::id())) {
            AuditLog::log('SUSPICIOUS_SUBMISSION', 'submissions', null, null, [
                'assign_id' => $data['assign_id'],
                'student_id' => Auth::id(),
                'reason' => 'Rapid duplicate submission'
            ]);
            Response::error('Please wait before submitting again', 429);
        }

        // Check if already submitted
        $existing = $this->submissionModel->findOne($data['assign_id'], Auth::id());
        if ($existing) {
            Response::error('Already submitted. Contact instructor for resubmission.', 400);
        }

        // Handle file upload if present
        if (isset($_FILES['file'])) {
            $uploader = new FileUpload('uploads/submissions/');
            $uploader->setAllowedTypes(FileUpload::getDocumentTypes());
            $uploader->setMaxSize(10);
            
            $result = $uploader->upload($_FILES['file']);
            if (!$result) {
                Response::error('File upload failed', 400, $uploader->getErrors());
            }
            $data['file_url'] = $result['url'];
        }

        $data['student_id'] = Auth::id();
        $data = Validator::sanitizeArray($data);
        
        $subId = $this->submissionModel->create($data);
        
        if ($subId) {
            AuditLog::createLog('submissions', $subId, $data);
            $submission = $this->submissionModel->findById($subId);
            Response::success($submission, 'Submitted successfully', 201);
        }
        
        Response::error('Failed to submit', 500);
    }

    private function grade($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $submission = $this->submissionModel->findById($id);
        if (!$submission) {
            Response::notFound('Submission not found');
        }

        $assignment = $this->assignmentModel->findById($submission['assign_id']);
        if (!Auth::isAdmin() && Auth::id() != $assignment['instructor_id']) {
            Response::forbidden();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['score'])) {
            Response::error('Score required', 400);
        }

        if ($data['score'] < 0 || $data['score'] > $assignment['max_score']) {
            Response::error('Invalid score', 400);
        }

        $feedback = $data['feedback'] ?? null;
        
        if ($this->submissionModel->grade($id, $data['score'], $feedback, Auth::id())) {
            AuditLog::log('GRADE_SUBMISSION', 'submissions', $id, null, [
                'score' => $data['score'],
                'graded_by' => Auth::id()
            ]);
            $updated = $this->submissionModel->findById($id);
            Response::success($updated, 'Graded successfully');
        }
        
        Response::error('Failed to grade', 500);
    }

    private function delete($id) {
        Auth::requireRole(['admin']);
        
        $submission = $this->submissionModel->findById($id);
        if (!$submission) {
            Response::notFound('Submission not found');
        }

        if ($this->submissionModel->delete($id)) {
            AuditLog::deleteLog('submissions', $id, $submission);
            Response::success(null, 'Submission deleted successfully');
        }
        
        Response::error('Failed to delete submission', 500);
    }
}
?>
