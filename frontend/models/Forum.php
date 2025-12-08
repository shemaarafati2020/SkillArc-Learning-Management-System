<?php
/**
 * Forum Model
 */
require_once __DIR__ . '/../config/database.php';

class Forum {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // Forums
    public function findByCourse($courseId) {
        $sql = "SELECT f.*, 
                (SELECT COUNT(*) FROM forum_threads WHERE forum_id = f.forum_id) as thread_count
                FROM forums f WHERE f.course_id = ? AND f.is_active = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function createForum($courseId, $title, $description = null) {
        $sql = "INSERT INTO forums (course_id, title, description) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iss', $courseId, $title, $description);
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    // Threads
    public function getThreads($forumId, $limit = 20, $offset = 0) {
        $sql = "SELECT t.*, u.name as author_name, u.avatar_url,
                (SELECT COUNT(*) FROM forum_replies WHERE thread_id = t.thread_id) as reply_count
                FROM forum_threads t
                JOIN users u ON t.user_id = u.user_id
                WHERE t.forum_id = ?
                ORDER BY t.is_pinned DESC, t.created_at DESC
                LIMIT ? OFFSET ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iii', $forumId, $limit, $offset);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function getThread($threadId) {
        $sql = "SELECT t.*, u.name as author_name, u.avatar_url, f.title as forum_title, f.course_id
                FROM forum_threads t
                JOIN users u ON t.user_id = u.user_id
                JOIN forums f ON t.forum_id = f.forum_id
                WHERE t.thread_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $threadId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function createThread($forumId, $userId, $title, $content) {
        $sql = "INSERT INTO forum_threads (forum_id, user_id, title, content) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iiss', $forumId, $userId, $title, $content);
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function updateThread($threadId, $data) {
        $fields = [];
        $params = [];
        $types = '';

        if (isset($data['title'])) {
            $fields[] = 'title = ?';
            $params[] = $data['title'];
            $types .= 's';
        }
        if (isset($data['content'])) {
            $fields[] = 'content = ?';
            $params[] = $data['content'];
            $types .= 's';
        }
        if (isset($data['is_pinned'])) {
            $fields[] = 'is_pinned = ?';
            $params[] = $data['is_pinned'];
            $types .= 'i';
        }
        if (isset($data['is_locked'])) {
            $fields[] = 'is_locked = ?';
            $params[] = $data['is_locked'];
            $types .= 'i';
        }

        if (empty($fields)) return false;

        $params[] = $threadId;
        $types .= 'i';

        $sql = "UPDATE forum_threads SET " . implode(', ', $fields) . " WHERE thread_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        return $stmt->execute();
    }

    public function deleteThread($threadId) {
        $sql = "DELETE FROM forum_threads WHERE thread_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $threadId);
        return $stmt->execute();
    }

    public function incrementViewCount($threadId) {
        $sql = "UPDATE forum_threads SET view_count = view_count + 1 WHERE thread_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $threadId);
        return $stmt->execute();
    }

    // Replies
    public function getReplies($threadId) {
        $sql = "SELECT r.*, u.name as author_name, u.avatar_url, u.role
                FROM forum_replies r
                JOIN users u ON r.user_id = u.user_id
                WHERE r.thread_id = ?
                ORDER BY r.created_at ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $threadId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function createReply($threadId, $userId, $content) {
        $sql = "INSERT INTO forum_replies (thread_id, user_id, content) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iis', $threadId, $userId, $content);
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function updateReply($replyId, $content) {
        $sql = "UPDATE forum_replies SET content = ? WHERE reply_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('si', $content, $replyId);
        return $stmt->execute();
    }

    public function deleteReply($replyId) {
        $sql = "DELETE FROM forum_replies WHERE reply_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $replyId);
        return $stmt->execute();
    }

    public function markAsSolution($replyId) {
        $sql = "UPDATE forum_replies SET is_solution = 1 WHERE reply_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $replyId);
        return $stmt->execute();
    }

    public function getReply($replyId) {
        $sql = "SELECT r.*, t.user_id as thread_author_id, f.course_id
                FROM forum_replies r
                JOIN forum_threads t ON r.thread_id = t.thread_id
                JOIN forums f ON t.forum_id = f.forum_id
                WHERE r.reply_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $replyId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
}
?>
