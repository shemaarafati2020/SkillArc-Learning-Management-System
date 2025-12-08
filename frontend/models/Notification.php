<?php
/**
 * Notification Model
 */
require_once __DIR__ . '/../config/database.php';

class Notification {
    private $db;
    private $table = 'notifications';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByUser($userId, $limit = 20, $unreadOnly = false) {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = ?";
        if ($unreadOnly) {
            $sql .= " AND is_read = 0";
        }
        $sql .= " ORDER BY sent_at DESC LIMIT ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $limit);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findById($id) {
        $sql = "SELECT * FROM {$this->table} WHERE notif_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function create($userId, $title, $message, $type = 'info', $link = null) {
        $sql = "INSERT INTO {$this->table} (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('issss', $userId, $title, $message, $type, $link);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function createBulk($userIds, $title, $message, $type = 'info', $link = null) {
        $sql = "INSERT INTO {$this->table} (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        $count = 0;
        foreach ($userIds as $userId) {
            $stmt->bind_param('issss', $userId, $title, $message, $type, $link);
            if ($stmt->execute()) {
                $count++;
            }
        }
        return $count;
    }

    public function markAsRead($id) {
        $sql = "UPDATE {$this->table} SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE notif_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    public function markAllAsRead($userId) {
        $sql = "UPDATE {$this->table} SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $userId);
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE notif_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    public function deleteOld($daysOld = 30) {
        $sql = "DELETE FROM {$this->table} WHERE sent_at < DATE_SUB(NOW(), INTERVAL ? DAY)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $daysOld);
        return $stmt->execute();
    }

    public function getUnreadCount($userId) {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE user_id = ? AND is_read = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result['count'];
    }

    // Helper methods to send specific notification types
    public static function sendGradeNotification($userId, $assignmentTitle, $score) {
        $notif = new self();
        return $notif->create(
            $userId,
            'Grade Posted',
            "Your submission for '{$assignmentTitle}' has been graded. Score: {$score}",
            'grade',
            '/dashboard/submissions'
        );
    }

    public static function sendDeadlineReminder($userId, $assignmentTitle, $dueDate) {
        $notif = new self();
        return $notif->create(
            $userId,
            'Deadline Approaching',
            "'{$assignmentTitle}' is due on {$dueDate}",
            'deadline',
            '/dashboard/assignments'
        );
    }

    public static function sendAnnouncement($userIds, $courseTitle, $message) {
        $notif = new self();
        return $notif->createBulk(
            $userIds,
            "Announcement: {$courseTitle}",
            $message,
            'announcement'
        );
    }

    public static function sendCourseCreated($userIds, $courseTitle, $instructorName) {
        $notif = new self();
        return $notif->createBulk(
            $userIds,
            'New Course Available',
            "A new course '{$courseTitle}' by {$instructorName} is now available!",
            'course',
            '/courses'
        );
    }

    public static function sendQuizCreated($userIds, $quizTitle, $courseTitle) {
        $notif = new self();
        return $notif->createBulk(
            $userIds,
            'New Quiz Available',
            "A new quiz '{$quizTitle}' has been added to {$courseTitle}",
            'quiz',
            '/quizzes'
        );
    }

    public static function sendForumThreadCreated($userIds, $threadTitle, $courseTitle) {
        $notif = new self();
        return $notif->createBulk(
            $userIds,
            'New Forum Discussion',
            "New discussion '{$threadTitle}' in {$courseTitle}",
            'forum',
            '/forums'
        );
    }

    public static function sendAssignmentCreated($userIds, $assignmentTitle, $courseTitle, $dueDate) {
        $notif = new self();
        return $notif->createBulk(
            $userIds,
            'New Assignment Posted',
            "New assignment '{$assignmentTitle}' in {$courseTitle}. Due: {$dueDate}",
            'assignment',
            '/assignments'
        );
    }
}
?>
