<?php
/**
 * Module Model
 */
require_once __DIR__ . '/../config/database.php';

class Module {
    private $db;
    private $table = 'modules';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByCourse($courseId) {
        $sql = "SELECT m.*, 
                (SELECT COUNT(*) FROM lessons WHERE module_id = m.module_id) as lesson_count
                FROM {$this->table} m 
                WHERE m.course_id = ? 
                ORDER BY m.order_index ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findById($id) {
        $sql = "SELECT m.*, c.title as course_title,
                (SELECT COUNT(*) FROM lessons WHERE module_id = m.module_id) as lesson_count
                FROM {$this->table} m 
                JOIN courses c ON m.course_id = c.course_id
                WHERE m.module_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_assoc();
    }

    public function create($data) {
        // Get next order index
        $courseId = $data['course_id'];
        $sql = "SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM {$this->table} WHERE course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $orderIndex = $result['next_order'];

        $sql = "INSERT INTO {$this->table} (course_id, title, description, order_index, is_published) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        $title = $data['title'];
        $description = $data['description'] ?? null;
        $isPublished = $data['is_published'] ?? 0;
        
        $stmt->bind_param('issii', $courseId, $title, $description, $orderIndex, $isPublished);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [];
        $types = '';

        $allowedFields = ['title', 'description', 'order_index', 'is_published'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
                $types .= ($field === 'order_index' || $field === 'is_published') ? 'i' : 's';
            }
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE module_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE module_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        
        return $stmt->execute();
    }

    public function reorder($courseId, $moduleOrders) {
        foreach ($moduleOrders as $moduleId => $order) {
            $sql = "UPDATE {$this->table} SET order_index = ? WHERE module_id = ? AND course_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param('iii', $order, $moduleId, $courseId);
            $stmt->execute();
        }
        return true;
    }
}
?>
