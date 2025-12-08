<?php
/**
 * Audit Log Helper
 */
require_once __DIR__ . '/../config/database.php';

class AuditLog {
    public static function log($action, $targetTable = null, $targetId = null, $oldValues = null, $newValues = null) {
        $db = Database::getInstance()->getConnection();
        
        $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        
        $sql = "INSERT INTO audit_logs (user_id, action, target_table, target_id, old_values, new_values, ip_address) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($sql);
        
        $oldJson = $oldValues ? json_encode($oldValues) : null;
        $newJson = $newValues ? json_encode($newValues) : null;
        
        $stmt->bind_param('ississs', $userId, $action, $targetTable, $targetId, $oldJson, $newJson, $ipAddress);
        
        return $stmt->execute();
    }

    public static function loginLog($userId) {
        return self::log('LOGIN', 'users', $userId);
    }

    public static function logoutLog($userId) {
        return self::log('LOGOUT', 'users', $userId);
    }

    public static function createLog($table, $id, $data) {
        return self::log('CREATE', $table, $id, null, $data);
    }

    public static function updateLog($table, $id, $oldData, $newData) {
        return self::log('UPDATE', $table, $id, $oldData, $newData);
    }

    public static function deleteLog($table, $id, $data) {
        return self::log('DELETE', $table, $id, $data, null);
    }

    public static function getRecentLogs($limit = 50) {
        $db = Database::getInstance()->getConnection();
        
        $sql = "SELECT al.*, u.name as user_name 
                FROM audit_logs al 
                LEFT JOIN users u ON al.user_id = u.user_id 
                ORDER BY al.created_at DESC 
                LIMIT ?";
        
        $stmt = $db->prepare($sql);
        $stmt->bind_param('i', $limit);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public static function getUserLogs($userId, $limit = 50) {
        $db = Database::getInstance()->getConnection();
        
        $sql = "SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?";
        
        $stmt = $db->prepare($sql);
        $stmt->bind_param('ii', $userId, $limit);
        $stmt->execute();
        
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
}
?>
