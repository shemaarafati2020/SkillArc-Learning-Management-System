<?php
/**
 * Enrollment Model
 */
require_once __DIR__ . '/../config/database.php';

class Enrollment {
    private $db;
    private $table = 'enrollments';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByUser($userId) {
        $sql = "SELECT e.*, c.title as course_title, c.thumbnail_url, c.type as course_type,
                u.name as instructor_name
                FROM {$this->table} e
                JOIN courses c ON e.course_id = c.course_id
                JOIN users u ON c.instructor_id = u.user_id
                WHERE e.user_id = ?
                ORDER BY e.enrolled_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findByCourse($courseId) {
        $sql = "SELECT e.*, u.name as student_name, u.email as student_email
                FROM {$this->table} e
                JOIN users u ON e.user_id = u.user_id
                WHERE e.course_id = ?
                ORDER BY e.enrolled_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findOne($userId, $courseId) {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = ? AND course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $courseId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function findById($id) {
        $sql = "SELECT e.*, c.title as course_title, u.name as student_name
                FROM {$this->table} e
                JOIN courses c ON e.course_id = c.course_id
                JOIN users u ON e.user_id = u.user_id
                WHERE e.enroll_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function create($userId, $courseId) {
        $sql = "INSERT INTO {$this->table} (user_id, course_id) VALUES (?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $courseId);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function updateProgress($userId, $courseId, $progress) {
        $sql = "UPDATE {$this->table} SET progress_percent = ? WHERE user_id = ? AND course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('dii', $progress, $userId, $courseId);
        return $stmt->execute();
    }

    public function complete($userId, $courseId) {
        $sql = "UPDATE {$this->table} SET status = 'completed', progress_percent = 100, completed_at = CURRENT_TIMESTAMP 
                WHERE user_id = ? AND course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $courseId);
        return $stmt->execute();
    }

    public function drop($userId, $courseId) {
        $sql = "UPDATE {$this->table} SET status = 'dropped' WHERE user_id = ? AND course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $courseId);
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE enroll_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    public function isEnrolled($userId, $courseId) {
        $enrollment = $this->findOne($userId, $courseId);
        return $enrollment && $enrollment['status'] === 'active';
    }

    public function calculateProgress($userId, $courseId) {
        $sql = "SELECT 
                (SELECT COUNT(*) FROM lessons l 
                 JOIN modules m ON l.module_id = m.module_id 
                 WHERE m.course_id = ?) as total_lessons,
                (SELECT COUNT(*) FROM lesson_progress lp 
                 JOIN lessons l ON lp.lesson_id = l.lesson_id
                 JOIN modules m ON l.module_id = m.module_id
                 WHERE m.course_id = ? AND lp.user_id = ? AND lp.is_completed = 1) as completed_lessons";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iii', $courseId, $courseId, $userId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result['total_lessons'] == 0) return 0;
        return round(($result['completed_lessons'] / $result['total_lessons']) * 100, 2);
    }
}
?>
