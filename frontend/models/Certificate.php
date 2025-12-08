<?php
/**
 * Certificate Model
 */
require_once __DIR__ . '/../config/database.php';

class Certificate {
    private $db;
    private $table = 'certificates';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByUser($userId) {
        $sql = "SELECT c.*, co.title as course_title, u.name as instructor_name
                FROM {$this->table} c
                JOIN courses co ON c.course_id = co.course_id
                JOIN users u ON co.instructor_id = u.user_id
                WHERE c.user_id = ?
                ORDER BY c.issue_date DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findById($id) {
        $sql = "SELECT c.*, co.title as course_title, u.name as student_name, 
                i.name as instructor_name
                FROM {$this->table} c
                JOIN courses co ON c.course_id = co.course_id
                JOIN users u ON c.user_id = u.user_id
                JOIN users i ON co.instructor_id = i.user_id
                WHERE c.cert_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function findByNumber($certNumber) {
        $sql = "SELECT c.*, co.title as course_title, u.name as student_name
                FROM {$this->table} c
                JOIN courses co ON c.course_id = co.course_id
                JOIN users u ON c.user_id = u.user_id
                WHERE c.certificate_number = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('s', $certNumber);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function findOne($userId, $courseId) {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = ? AND course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $courseId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function create($userId, $courseId, $finalGrade = null) {
        $certNumber = $this->generateCertificateNumber();
        
        $sql = "INSERT INTO {$this->table} (user_id, course_id, certificate_number, issue_date, final_grade) 
                VALUES (?, ?, ?, CURDATE(), ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iisd', $userId, $courseId, $certNumber, $finalGrade);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function updatePdfUrl($id, $pdfUrl) {
        $sql = "UPDATE {$this->table} SET pdf_url = ? WHERE cert_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('si', $pdfUrl, $id);
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE cert_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    private function generateCertificateNumber() {
        $prefix = 'LMS';
        $year = date('Y');
        $random = strtoupper(bin2hex(random_bytes(4)));
        return "{$prefix}-{$year}-{$random}";
    }

    public function verifyCertificate($certNumber) {
        $cert = $this->findByNumber($certNumber);
        return $cert ? true : false;
    }
}
?>
