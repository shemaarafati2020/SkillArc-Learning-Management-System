<?php
/**
 * User Model
 */
require_once __DIR__ . '/../config/database.php';

class User {
    private $db;
    private $table = 'users';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findAll($filters = []) {
        $sql = "SELECT user_id, name, email, role, avatar_url, institution, is_active, created_at, last_login FROM {$this->table} WHERE 1=1";
        $params = [];
        $types = '';

        if (!empty($filters['role'])) {
            $sql .= " AND role = ?";
            $params[] = $filters['role'];
            $types .= 's';
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (name LIKE ? OR email LIKE ?)";
            $search = '%' . $filters['search'] . '%';
            $params[] = $search;
            $params[] = $search;
            $types .= 'ss';
        }

        if (isset($filters['is_active'])) {
            $sql .= " AND is_active = ?";
            $params[] = $filters['is_active'];
            $types .= 'i';
        }

        $sql .= " ORDER BY created_at DESC";

        if (!empty($filters['limit'])) {
            $sql .= " LIMIT ?";
            $params[] = $filters['limit'];
            $types .= 'i';
            
            if (!empty($filters['offset'])) {
                $sql .= " OFFSET ?";
                $params[] = $filters['offset'];
                $types .= 'i';
            }
        }

        $stmt = $this->db->prepare($sql);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findById($id) {
        $sql = "SELECT user_id, name, email, role, avatar_url, bio, institution, language_preference, theme_preference, is_active, created_at, last_login FROM {$this->table} WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_assoc();
    }

    public function findByEmail($email) {
        $sql = "SELECT * FROM {$this->table} WHERE email = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('s', $email);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_assoc();
    }

    public function create($data) {
        $sql = "INSERT INTO {$this->table} (name, email, password, role, institution) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        $name = $data['name'];
        $email = $data['email'];
        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
        $role = $data['role'] ?? 'student';
        $institution = $data['institution'] ?? null;
        
        $stmt->bind_param('sssss', $name, $email, $hashedPassword, $role, $institution);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [];
        $types = '';

        $allowedFields = ['name', 'email', 'role', 'avatar_url', 'bio', 'institution', 'language_preference', 'theme_preference', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
                $types .= is_int($data[$field]) ? 'i' : 's';
            }
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        return $stmt->execute();
    }

    public function updatePassword($id, $newPassword) {
        $sql = "UPDATE {$this->table} SET password = ? WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt->bind_param('si', $hashedPassword, $id);
        
        return $stmt->execute();
    }

    public function updateLastLogin($id) {
        $sql = "UPDATE {$this->table} SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        
        return $stmt->execute();
    }

    public function count($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE 1=1";
        $params = [];
        $types = '';

        if (!empty($filters['role'])) {
            $sql .= " AND role = ?";
            $params[] = $filters['role'];
            $types .= 's';
        }

        $stmt = $this->db->prepare($sql);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        
        $result = $stmt->get_result()->fetch_assoc();
        return $result['total'];
    }

    public function getInstructors() {
        return $this->findAll(['role' => 'instructor']);
    }

    public function getStudents() {
        return $this->findAll(['role' => 'student']);
    }
}
?>
