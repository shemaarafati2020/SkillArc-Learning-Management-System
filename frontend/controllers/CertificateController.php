<?php
/**
 * Certificate Controller
 */
require_once __DIR__ . '/../models/Certificate.php';
require_once __DIR__ . '/../models/Enrollment.php';
require_once __DIR__ . '/../models/Course.php';

class CertificateController {
    private $certModel;
    private $enrollmentModel;
    private $courseModel;

    public function __construct() {
        $this->certModel = new Certificate();
        $this->enrollmentModel = new Enrollment();
        $this->courseModel = new Course();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'my-certificates') {
                    $this->getMyCertificates();
                } elseif ($action === 'verify' && $id) {
                    $this->verify($id);
                } elseif ($action === 'download' && $id) {
                    $this->download($id);
                } elseif ($id) {
                    $this->getOne($id);
                }
                break;
            case 'POST':
                if ($action === 'generate') {
                    $this->generate();
                }
                break;
            case 'DELETE':
                if ($id) $this->delete($id);
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function getMyCertificates() {
        Auth::requireAuth();
        $certificates = $this->certModel->findByUser(Auth::id());
        Response::success($certificates);
    }

    private function getOne($id) {
        $cert = $this->certModel->findById($id);
        if ($cert) {
            Response::success($cert);
        }
        Response::notFound('Certificate not found');
    }

    private function verify($certNumber) {
        $cert = $this->certModel->findByNumber($certNumber);
        if ($cert) {
            Response::success([
                'valid' => true,
                'certificate' => $cert
            ]);
        }
        Response::success(['valid' => false], 'Certificate not found');
    }

    private function generate() {
        Auth::requireAuth();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['course_id'])) {
            Response::error('Course ID required', 400);
        }

        $courseId = (int)$data['course_id'];
        $userId = Auth::id();

        // Check enrollment and completion
        $enrollment = $this->enrollmentModel->findOne($userId, $courseId);
        if (!$enrollment) {
            Response::error('Not enrolled in this course', 400);
        }

        if ($enrollment['status'] !== 'completed') {
            Response::error('Course not completed yet', 400);
        }

        // Check if certificate already exists
        $existing = $this->certModel->findOne($userId, $courseId);
        if ($existing) {
            Response::success($existing, 'Certificate already exists');
        }

        // Calculate final grade (could be based on assignments/quizzes)
        $finalGrade = $enrollment['progress_percent'];

        $certId = $this->certModel->create($userId, $courseId, $finalGrade);
        
        if ($certId) {
            AuditLog::createLog('certificates', $certId, ['user_id' => $userId, 'course_id' => $courseId]);
            $cert = $this->certModel->findById($certId);
            Response::success($cert, 'Certificate generated successfully', 201);
        }
        
        Response::error('Failed to generate certificate', 500);
    }

    private function download($id) {
        $cert = $this->certModel->findById($id);
        if (!$cert) {
            Response::notFound('Certificate not found');
        }

        // Generate PDF content (simplified)
        $html = $this->generateCertificateHtml($cert);
        
        Response::success([
            'html' => $html,
            'certificate' => $cert
        ]);
    }

    private function generateCertificateHtml($cert) {
        return "
        <div style='text-align:center; padding:50px; border:5px solid #gold; font-family:Georgia,serif;'>
            <h1 style='color:#1a237e;'>Certificate of Completion</h1>
            <p style='font-size:18px;'>This is to certify that</p>
            <h2 style='color:#333; font-size:32px;'>{$cert['student_name']}</h2>
            <p style='font-size:18px;'>has successfully completed the course</p>
            <h3 style='color:#1a237e; font-size:24px;'>{$cert['course_title']}</h3>
            <p style='font-size:16px;'>with a final grade of <strong>{$cert['final_grade']}%</strong></p>
            <p style='margin-top:30px;'>Issue Date: {$cert['issue_date']}</p>
            <p>Certificate Number: <strong>{$cert['certificate_number']}</strong></p>
            <p style='margin-top:20px;'>Instructor: {$cert['instructor_name']}</p>
        </div>";
    }

    private function delete($id) {
        Auth::requireRole(['admin']);
        
        $cert = $this->certModel->findById($id);
        if (!$cert) {
            Response::notFound('Certificate not found');
        }

        if ($this->certModel->delete($id)) {
            AuditLog::deleteLog('certificates', $id, $cert);
            Response::success(null, 'Certificate deleted successfully');
        }
        
        Response::error('Failed to delete certificate', 500);
    }
}
?>
