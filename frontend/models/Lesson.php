<?php
/**
 * Lesson Model
 */
require_once __DIR__ . '/../config/database.php';

class Lesson {
    private $db;
    private $table = 'lessons';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByModule($moduleId) {
        $sql = "SELECT * FROM {$this->table} WHERE module_id = ? ORDER BY order_index ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $moduleId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findById($id) {
        $sql = "SELECT l.*, m.title as module_title, m.course_id, c.title as course_title
                FROM {$this->table} l 
                JOIN modules m ON l.module_id = m.module_id
                JOIN courses c ON m.course_id = c.course_id
                WHERE l.lesson_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function findByCourse($courseId) {
        $sql = "SELECT l.*, m.title as module_title 
                FROM {$this->table} l 
                JOIN modules m ON l.module_id = m.module_id 
                WHERE m.course_id = ? 
                ORDER BY m.order_index, l.order_index ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function create($data) {
        $moduleId = $data['module_id'];
        
        $sql = "SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM {$this->table} WHERE module_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $moduleId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $orderIndex = $result['next_order'];

        $sql = "INSERT INTO {$this->table} (module_id, title, description, content_type, content_url, content_text, duration_minutes, order_index, is_published) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        $title = $data['title'];
        $description = $data['description'] ?? null;
        $contentType = $data['content_type'];
        $contentUrl = $data['content_url'] ?? null;
        $contentText = $data['content_text'] ?? null;
        $duration = $data['duration_minutes'] ?? null;
        $isPublished = $data['is_published'] ?? 0;
        
        $stmt->bind_param('isssssiii', $moduleId, $title, $description, $contentType, $contentUrl, $contentText, $duration, $orderIndex, $isPublished);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [];
        $types = '';

        $allowedFields = ['title', 'description', 'content_type', 'content_url', 'content_text', 'duration_minutes', 'order_index', 'is_published'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
                $types .= in_array($field, ['duration_minutes', 'order_index', 'is_published']) ? 'i' : 's';
            }
        }

        if (empty($fields)) return false;

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE lesson_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE lesson_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    public function markComplete($userId, $lessonId) {
        $sql = "INSERT INTO lesson_progress (user_id, lesson_id, is_completed, completed_at) 
                VALUES (?, ?, 1, CURRENT_TIMESTAMP) 
                ON DUPLICATE KEY UPDATE is_completed = 1, completed_at = CURRENT_TIMESTAMP";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $lessonId);
        return $stmt->execute();
    }

    public function getProgress($userId, $lessonId) {
        $sql = "SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $lessonId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
}
?>
