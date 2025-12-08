<?php
/**
 * Backup Controller
 * Handles database backup operations
 */
require_once __DIR__ . '/../config/database.php';

class BackupController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'download') {
                    $this->downloadBackup();
                } elseif ($action === 'list') {
                    $this->listBackups();
                }
                break;
            case 'POST':
                if ($action === 'create') {
                    $this->createBackup();
                }
                break;
            case 'DELETE':
                if ($id) $this->deleteBackup($id);
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function createBackup() {
        Auth::requireRole(['admin']);

        try {
            $backupDir = __DIR__ . '/../backups/';
            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            $timestamp = date('Y-m-d_H-i-s');
            $filename = "lms_backup_{$timestamp}.sql";
            $filepath = $backupDir . $filename;

            // Get database credentials
            $host = DB_HOST;
            $user = DB_USER;
            $pass = DB_PASS;
            $name = DB_NAME;

            // Create backup using mysqldump
            $command = "mysqldump --host={$host} --user={$user} --password={$pass} {$name} > {$filepath}";
            
            // Execute backup command
            exec($command, $output, $returnVar);

            if ($returnVar === 0 && file_exists($filepath)) {
                // Log the backup
                AuditLog::log('BACKUP_CREATED', 'system', null, [
                    'filename' => $filename,
                    'size' => filesize($filepath)
                ]);

                Response::success([
                    'filename' => $filename,
                    'size' => filesize($filepath),
                    'created_at' => date('Y-m-d H:i:s')
                ], 'Backup created successfully');
            } else {
                Response::error('Failed to create backup', 500);
            }
        } catch (Exception $e) {
            Response::error('Backup error: ' . $e->getMessage(), 500);
        }
    }

    private function downloadBackup() {
        Auth::requireRole(['admin']);

        $filename = $_GET['filename'] ?? '';
        if (empty($filename)) {
            Response::error('Filename required', 400);
        }

        // Sanitize filename
        $filename = basename($filename);
        $filepath = __DIR__ . '/../backups/' . $filename;

        if (!file_exists($filepath)) {
            Response::notFound('Backup file not found');
        }

        // Log the download
        AuditLog::log('BACKUP_DOWNLOADED', 'system', null, ['filename' => $filename]);

        // Send file
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . filesize($filepath));
        readfile($filepath);
        exit;
    }

    private function listBackups() {
        Auth::requireRole(['admin']);

        $backupDir = __DIR__ . '/../backups/';
        if (!is_dir($backupDir)) {
            Response::success([]);
        }

        $backups = [];
        $files = scandir($backupDir);

        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..' && pathinfo($file, PATHINFO_EXTENSION) === 'sql') {
                $filepath = $backupDir . $file;
                $backups[] = [
                    'filename' => $file,
                    'size' => filesize($filepath),
                    'created_at' => date('Y-m-d H:i:s', filemtime($filepath))
                ];
            }
        }

        // Sort by creation date (newest first)
        usort($backups, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        Response::success($backups);
    }

    private function deleteBackup($filename) {
        Auth::requireRole(['admin']);

        // Sanitize filename
        $filename = basename($filename);
        $filepath = __DIR__ . '/../backups/' . $filename;

        if (!file_exists($filepath)) {
            Response::notFound('Backup file not found');
        }

        if (unlink($filepath)) {
            AuditLog::log('BACKUP_DELETED', 'system', null, ['filename' => $filename]);
            Response::success(null, 'Backup deleted successfully');
        }

        Response::error('Failed to delete backup', 500);
    }
}
?>
