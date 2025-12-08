<?php
/**
 * Audit Log Controller
 */
require_once __DIR__ . '/../config/database.php';

class AuditLogController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function handleRequest($method, $id, $action) {
        if ($method !== 'GET') {
            Response::error('Method not allowed', 405);
        }

        Auth::requireRole(['admin']);

        switch ($action) {
            case 'user':
                if ($id) $this->getByUser($id);
                break;
            case 'table':
                if ($id) $this->getByTable($id);
                break;
            case 'export':
                $this->export();
                break;
            default:
                $this->getAll();
        }
    }

    private function getAll() {
        $limit = $_GET['limit'] ?? 100;
        $offset = $_GET['offset'] ?? 0;
        $action = $_GET['action'] ?? null;
        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;

        $sql = "SELECT al.*, u.name as user_name, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                WHERE 1=1";
        $params = [];
        $types = '';

        if ($action) {
            $sql .= " AND al.action = ?";
            $params[] = $action;
            $types .= 's';
        }

        if ($startDate) {
            $sql .= " AND al.created_at >= ?";
            $params[] = $startDate;
            $types .= 's';
        }

        if ($endDate) {
            $sql .= " AND al.created_at <= ?";
            $params[] = $endDate . ' 23:59:59';
            $types .= 's';
        }

        $sql .= " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
        $params[] = (int)$limit;
        $params[] = (int)$offset;
        $types .= 'ii';

        $stmt = $this->db->prepare($sql);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $logs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        // Get total count
        $countSql = "SELECT COUNT(*) as total FROM audit_logs";
        $total = $this->db->query($countSql)->fetch_assoc()['total'];

        Response::success([
            'logs' => $logs,
            'total' => $total,
            'limit' => (int)$limit,
            'offset' => (int)$offset
        ]);
    }

    private function getByUser($userId) {
        $limit = $_GET['limit'] ?? 50;
        
        $sql = "SELECT al.*, u.name as user_name
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                WHERE al.user_id = ?
                ORDER BY al.created_at DESC
                LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $userId, $limit);
        $stmt->execute();
        $logs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        Response::success($logs);
    }

    private function getByTable($table) {
        $limit = $_GET['limit'] ?? 50;
        
        $sql = "SELECT al.*, u.name as user_name
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                WHERE al.target_table = ?
                ORDER BY al.created_at DESC
                LIMIT ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('si', $table, $limit);
        $stmt->execute();
        $logs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        Response::success($logs);
    }

    private function export() {
        $format = $_GET['format'] ?? 'json';
        $startDate = $_GET['start_date'] ?? date('Y-m-d', strtotime('-30 days'));
        $endDate = $_GET['end_date'] ?? date('Y-m-d');

        $sql = "SELECT al.*, u.name as user_name, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.user_id
                WHERE al.created_at BETWEEN ? AND ?
                ORDER BY al.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $endDateTime = $endDate . ' 23:59:59';
        $stmt->bind_param('ss', $startDate, $endDateTime);
        $stmt->execute();
        $logs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        if ($format === 'csv') {
            $csv = "ID,User,Action,Table,Target ID,IP Address,Created At\n";
            foreach ($logs as $log) {
                $csv .= "{$log['log_id']},{$log['user_name']},{$log['action']},{$log['target_table']},{$log['target_id']},{$log['ip_address']},{$log['created_at']}\n";
            }
            Response::success(['csv' => $csv, 'filename' => "audit_logs_{$startDate}_to_{$endDate}.csv"]);
        }

        Response::success($logs);
    }

    public static function getActionTypes() {
        $db = Database::getInstance()->getConnection();
        $sql = "SELECT DISTINCT action FROM audit_logs ORDER BY action";
        $result = $db->query($sql);
        return $result->fetch_all(MYSQLI_ASSOC);
    }
}
?>
