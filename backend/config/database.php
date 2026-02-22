<?php
/**
 * Database Configuration and Connection
 * Learning Management System
 * 
 * Credentials are loaded from environment variables.
 * Copy .env.example to .env and set your values.
 */

// Load environment variables from .env file if it exists
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        // Remove surrounding quotes
        $value = trim($value, '"\'');
        if (!getenv($key)) {
            putenv("$key=$value");
        }
    }
}

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'lms_db');

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        $this->connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($this->connection->connect_error) {
            // Log the actual error server-side, never expose to client
            error_log('Database connection failed: ' . $this->connection->connect_error);
            die(json_encode([
                'success' => false,
                'message' => 'Database connection failed. Please try again later.'
            ]));
        }
        
        $this->connection->set_charset('utf8mb4');
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    public function query($sql, $params = [], $types = '') {
        $stmt = $this->connection->prepare($sql);
        
        if (!$stmt) {
            error_log('SQL prepare error: ' . $this->connection->error);
            return ['error' => 'A database error occurred'];
        }
        
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        
        $stmt->execute();
        return $stmt;
    }

    public function lastInsertId() {
        return $this->connection->insert_id;
    }

    public function escape($string) {
        return $this->connection->real_escape_string($string);
    }
}
?>
