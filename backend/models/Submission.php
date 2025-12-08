<?php
/**
 * Submission Model
 */
require_once __DIR__ . '/../config/database.php';

class Submission {
    private $db;
    private $table = 'submissions';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByAssignment($assignId) {
        $sql = "SELECT s.*, u.name as student_name, u.email as student_email
                FROM {$this->table} s
                JOIN users u ON s.student_id = u.user_id
                WHERE s.assign_id = ?
                ORDER BY s.submitted_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $assignId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findByStudent($studentId) {
        $sql = "SELECT s.*, a.title as assignment_title, a.max_score, a.due_date, c.title as course_title
                FROM {$this->table} s
                JOIN assignments a ON s.assign_id = a.assign_id
                JOIN courses c ON a.course_id = c.course_id
                WHERE s.student_id = ?
                ORDER BY s.submitted_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $studentId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findById($id) {
        $sql = "SELECT s.*, u.name as student_name, a.title as assignment_title, 
                a.max_score, a.due_date, c.title as course_title
                FROM {$this->table} s
                JOIN users u ON s.student_id = u.user_id
                JOIN assignments a ON s.assign_id = a.assign_id
                JOIN courses c ON a.course_id = c.course_id
                WHERE s.sub_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function findOne($assignId, $studentId) {
        $sql = "SELECT * FROM {$this->table} WHERE assign_id = ? AND student_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $assignId, $studentId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function create($data) {
        $sql = "INSERT INTO {$this->table} (assign_id, student_id, file_url, text_content) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        $assignId = $data['assign_id'];
        $studentId = $data['student_id'];
        $fileUrl = $data['file_url'] ?? null;
        $textContent = $data['text_content'] ?? null;
        
        $stmt->bind_param('iiss', $assignId, $studentId, $fileUrl, $textContent);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function grade($id, $score, $feedback, $gradedBy) {
        $sql = "UPDATE {$this->table} SET score = ?, feedback = ?, status = 'graded', 
                graded_at = CURRENT_TIMESTAMP, graded_by = ? WHERE sub_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('dsii', $score, $feedback, $gradedBy, $id);
        return $stmt->execute();
    }

    public function flagPlagiarism($id, $score) {
        $sql = "UPDATE {$this->table} SET plagiarism_score = ?, plagiarism_flag = ? WHERE sub_id = ?";
        $stmt = $this->db->prepare($sql);
        $flag = $score > 30 ? 1 : 0;
        $stmt->bind_param('dii', $score, $flag, $id);
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE sub_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    public function checkDuplicateSubmission($assignId, $studentId, $timeWindowSeconds = 60) {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE assign_id = ? AND student_id = ? 
                AND submitted_at > DATE_SUB(NOW(), INTERVAL ? SECOND)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iii', $assignId, $studentId, $timeWindowSeconds);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result['count'] > 0;
    }
}
?>
