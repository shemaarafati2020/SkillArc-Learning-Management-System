<?php
/**
 * Course Model
 */
require_once __DIR__ . '/../config/database.php';

class Course {
    private $db;
    private $table = 'courses';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findAll($filters = []) {
        $sql = "SELECT c.*, u.name as instructor_name, 
                (SELECT COUNT(*) FROM enrollments WHERE course_id = c.course_id) as enrolled_count,
                (SELECT COUNT(*) FROM modules WHERE course_id = c.course_id) as module_count
                FROM {$this->table} c 
                JOIN users u ON c.instructor_id = u.user_id 
                WHERE 1=1";
        $params = [];
        $types = '';

        if (!empty($filters['instructor_id'])) {
            $sql .= " AND c.instructor_id = ?";
            $params[] = $filters['instructor_id'];
            $types .= 'i';
        }

        if (!empty($filters['status'])) {
            $sql .= " AND c.status = ?";
            $params[] = $filters['status'];
            $types .= 's';
        }

        if (!empty($filters['type'])) {
            $sql .= " AND c.type = ?";
            $params[] = $filters['type'];
            $types .= 's';
        }

        if (!empty($filters['category'])) {
            $sql .= " AND c.category = ?";
            $params[] = $filters['category'];
            $types .= 's';
        }

        if (!empty($filters['search'])) {
            $sql .= " AND (c.title LIKE ? OR c.description LIKE ?)";
            $search = '%' . $filters['search'] . '%';
            $params[] = $search;
            $params[] = $search;
            $types .= 'ss';
        }

        $sql .= " ORDER BY c.created_at DESC";

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
        $sql = "SELECT c.*, u.name as instructor_name, u.email as instructor_email,
                (SELECT COUNT(*) FROM enrollments WHERE course_id = c.course_id) as enrolled_count,
                (SELECT COUNT(*) FROM modules WHERE course_id = c.course_id) as module_count
                FROM {$this->table} c 
                JOIN users u ON c.instructor_id = u.user_id 
                WHERE c.course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_assoc();
    }

    public function create($data) {
        $sql = "INSERT INTO {$this->table} (instructor_id, title, description, thumbnail_url, category, level, language, duration_hours, price, prerequisites, learning_outcomes, tags, start_date, end_date, type, status, max_students, passing_percentage) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        $instructorId = $data['instructor_id'];
        $title = $data['title'];
        $description = $data['description'] ?? null;
        $thumbnailUrl = $data['thumbnail_url'] ?? null;
        $category = $data['category'] ?? null;
        $level = $data['level'] ?? 'all-levels';
        $language = $data['language'] ?? 'English';
        $durationHours = $data['duration_hours'] ?? 0.00;
        $price = $data['price'] ?? 0.00;
        $prerequisites = $data['prerequisites'] ?? null;
        $learningOutcomes = $data['learning_outcomes'] ?? null;
        $tags = $data['tags'] ?? null;
        $startDate = $data['start_date'] ?? null;
        $endDate = $data['end_date'] ?? null;
        $type = $data['type'] ?? 'self-paced';
        $status = $data['status'] ?? 'draft';
        $maxStudents = $data['max_students'] ?? null;
        $passingPercentage = $data['passing_percentage'] ?? 60.00;
        
        $stmt->bind_param('issssssddsssssssid', 
            $instructorId, $title, $description, $thumbnailUrl, $category, $level, $language,
            $durationHours, $price, $prerequisites, $learningOutcomes, $tags,
            $startDate, $endDate, $type, $status, $maxStudents, $passingPercentage
        );
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [];
        $types = '';

        $allowedFields = ['instructor_id', 'title', 'description', 'thumbnail_url', 'category', 'level', 'language', 'duration_hours', 'price', 'prerequisites', 'learning_outcomes', 'tags', 'start_date', 'end_date', 'type', 'status', 'max_students', 'passing_percentage'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
                if (in_array($field, ['max_students', 'instructor_id'])) {
                    $types .= 'i';
                } elseif (in_array($field, ['passing_percentage', 'duration_hours', 'price'])) {
                    $types .= 'd';
                } else {
                    $types .= 's';
                }
            }
        }

        if (empty($fields)) {
            return false;
        }

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        
        return $stmt->execute();
    }

    public function count($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM {$this->table} WHERE 1=1";
        $params = [];
        $types = '';

        if (!empty($filters['status'])) {
            $sql .= " AND status = ?";
            $params[] = $filters['status'];
            $types .= 's';
        }

        if (!empty($filters['instructor_id'])) {
            $sql .= " AND instructor_id = ?";
            $params[] = $filters['instructor_id'];
            $types .= 'i';
        }

        $stmt = $this->db->prepare($sql);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        
        $result = $stmt->get_result()->fetch_assoc();
        return $result['total'];
    }

    public function getPublishedCourses() {
        return $this->findAll(['status' => 'published']);
    }

    public function getCategories() {
        $sql = "SELECT DISTINCT category FROM {$this->table} WHERE category IS NOT NULL ORDER BY category";
        $result = $this->db->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
?>
