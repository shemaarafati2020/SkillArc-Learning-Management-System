<?php
/**
 * Notification Controller
 */
require_once __DIR__ . '/../models/Notification.php';

class NotificationController {
    private $notifModel;

    public function __construct() {
        $this->notifModel = new Notification();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'unread-count') {
                    $this->getUnreadCount();
                } else {
                    $this->getMyNotifications();
                }
                break;
            case 'POST':
                if ($action === 'mark-read' && $id) {
                    $this->markAsRead($id);
                } elseif ($action === 'mark-all-read') {
                    $this->markAllAsRead();
                } elseif ($action === 'send') {
                    $this->send();
                }
                break;
            case 'DELETE':
                if ($id) $this->delete($id);
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function getMyNotifications() {
        Auth::requireAuth();
        
        $limit = $_GET['limit'] ?? 20;
        $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === 'true';
        
        $notifications = $this->notifModel->findByUser(Auth::id(), $limit, $unreadOnly);
        $unreadCount = $this->notifModel->getUnreadCount(Auth::id());
        
        Response::success([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }

    private function getUnreadCount() {
        Auth::requireAuth();
        $count = $this->notifModel->getUnreadCount(Auth::id());
        Response::success(['count' => $count]);
    }

    private function markAsRead($id) {
        Auth::requireAuth();
        
        $notif = $this->notifModel->findById($id);
        if (!$notif || $notif['user_id'] != Auth::id()) {
            Response::notFound('Notification not found');
        }

        if ($this->notifModel->markAsRead($id)) {
            Response::success(null, 'Marked as read');
        }
        
        Response::error('Failed to mark as read', 500);
    }

    private function markAllAsRead() {
        Auth::requireAuth();
        
        if ($this->notifModel->markAllAsRead(Auth::id())) {
            Response::success(null, 'All notifications marked as read');
        }
        
        Response::error('Failed to mark notifications as read', 500);
    }

    private function send() {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('title')
            ->required('message');
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        $type = $data['type'] ?? 'info';
        $link = $data['link'] ?? null;
        
        // Send to specific users or all users of a course
        if (isset($data['user_ids']) && is_array($data['user_ids'])) {
            $count = $this->notifModel->createBulk($data['user_ids'], $data['title'], $data['message'], $type, $link);
            Response::success(['sent' => $count], "Notification sent to {$count} users");
        } elseif (isset($data['user_id'])) {
            $id = $this->notifModel->create($data['user_id'], $data['title'], $data['message'], $type, $link);
            if ($id) {
                Response::success(['notif_id' => $id], 'Notification sent');
            }
        } else {
            Response::error('User ID(s) required', 400);
        }
        
        Response::error('Failed to send notification', 500);
    }

    private function delete($id) {
        Auth::requireAuth();
        
        $notif = $this->notifModel->findById($id);
        if (!$notif) {
            Response::notFound('Notification not found');
        }

        // Users can only delete their own notifications, admins can delete any
        if ($notif['user_id'] != Auth::id() && !Auth::isAdmin()) {
            Response::forbidden();
        }

        if ($this->notifModel->delete($id)) {
            Response::success(null, 'Notification deleted');
        }
        
        Response::error('Failed to delete notification', 500);
    }
}
?>
