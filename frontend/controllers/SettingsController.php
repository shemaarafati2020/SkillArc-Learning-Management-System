<?php
/**
 * Settings Controller
 */
require_once __DIR__ . '/../config/database.php';

class SettingsController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->getSetting($id);
                } else {
                    $this->getAllSettings();
                }
                break;
            case 'PUT':
                if ($id) {
                    $this->updateSetting($id);
                } else {
                    $this->updateMultiple();
                }
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function getAllSettings() {
        Auth::requireRole(['admin']);
        
        $sql = "SELECT * FROM system_settings ORDER BY setting_key";
        $result = $this->db->query($sql);
        $settings = $result->fetch_all(MYSQLI_ASSOC);
        
        // Convert to key-value pairs
        $settingsMap = [];
        foreach ($settings as $setting) {
            $settingsMap[$setting['setting_key']] = $setting['setting_value'];
        }
        
        Response::success($settingsMap);
    }

    private function getSetting($key) {
        Auth::requireRole(['admin']);
        
        $sql = "SELECT * FROM system_settings WHERE setting_key = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('s', $key);
        $stmt->execute();
        $setting = $stmt->get_result()->fetch_assoc();
        
        if ($setting) {
            Response::success($setting);
        }
        Response::notFound('Setting not found');
    }

    private function updateSetting($key) {
        Auth::requireRole(['admin']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['value'])) {
            Response::error('Value required', 400);
        }

        $sql = "UPDATE system_settings SET setting_value = ? WHERE setting_key = ?";
        $stmt = $this->db->prepare($sql);
        $value = $data['value'];
        $stmt->bind_param('ss', $value, $key);
        
        if ($stmt->execute()) {
            AuditLog::log('UPDATE_SETTING', 'system_settings', null, ['key' => $key], ['key' => $key, 'value' => $value]);
            Response::success(null, 'Setting updated');
        }
        
        Response::error('Failed to update setting', 500);
    }

    private function updateMultiple() {
        Auth::requireRole(['admin']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!is_array($data)) {
            Response::error('Invalid data format', 400);
        }

        $sql = "UPDATE system_settings SET setting_value = ? WHERE setting_key = ?";
        $stmt = $this->db->prepare($sql);
        
        $updated = 0;
        foreach ($data as $key => $value) {
            $stmt->bind_param('ss', $value, $key);
            if ($stmt->execute()) {
                $updated++;
            }
        }
        
        AuditLog::log('UPDATE_SETTINGS', 'system_settings', null, null, $data);
        Response::success(['updated' => $updated], "{$updated} settings updated");
    }

    // Public settings (non-sensitive)
    public static function getPublicSettings() {
        $db = Database::getInstance()->getConnection();
        $sql = "SELECT setting_key, setting_value FROM system_settings 
                WHERE setting_key IN ('site_name', 'default_language')";
        $result = $db->query($sql);
        
        $settings = [];
        while ($row = $result->fetch_assoc()) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        return $settings;
    }
}
?>
