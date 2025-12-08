<?php
/**
 * Assignment Model
 */
require_once __DIR__ . '/../config/database.php';

class Assignment {
    private $db;
    private $table = 'assignments';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByCourse($courseId) {
        $sql = "SELECT a.*, 
                (SELECT COUNT(*) FROM submissions WHERE assign_id = a.assign_id) as submission_count
                FROM {$this->table} a 
                WHERE a.course_id = ? 
                ORDER BY a.due_date ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findById($id) {
        $sql = "SELECT a.*, c.title as course_title, c.instructor_id
                FROM {$this->table} a 
                JOIN courses c ON a.course_id = c.course_id
                WHERE a.assign_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function findUpcoming($userId, $limit = 5) {
        $sql = "SELECT a.*, c.title as course_title
                FROM {$this->table} a
                JOIN courses c ON a.course_id = c.course_id
                JOIN enrollments e ON c.course_id = e.course_id
                WHERE e.user_id = ? AND e.status = 'active'
                AND a.due_date > NOW() AND a.is_published = 1
                ORDER BY a.due_date ASC
                LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $limit);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function create($data) {
        $sql = "INSERT INTO {$this->table} (course_id, title, description, due_date, max_score, is_published) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        $courseId = $data['course_id'];
        $title = $data['title'];
        $description = $data['description'] ?? null;
        $dueDate = $data['due_date'] ?? null;
        $maxScore = $data['max_score'] ?? 100;
        $isPublished = $data['is_published'] ?? 0;
        
        $stmt->bind_param('isssdi', $courseId, $title, $description, $dueDate, $maxScore, $isPublished);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [];
        $types = '';

        $allowedFields = ['title', 'description', 'due_date', 'max_score', 'is_published'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
                if ($field === 'max_score') {
                    $types .= 'd';
                } elseif ($field === 'is_published') {
                    $types .= 'i';
                } else {
                    $types .= 's';
                }
            }
        }

        if (empty($fields)) return false;

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE assign_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE assign_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }
}
?>
