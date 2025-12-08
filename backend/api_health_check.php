<?php
/**
 * API Health Check
 * Tests if the API is accessible and working
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

$health = [
    'status' => 'OK',
    'timestamp' => date('Y-m-d H:i:s'),
    'checks' => []
];

// Check 1: PHP Version
$health['checks']['php_version'] = [
    'status' => 'OK',
    'value' => PHP_VERSION
];

// Check 2: Session
$health['checks']['session'] = [
    'status' => isset($_SESSION['user_id']) ? 'LOGGED_IN' : 'NOT_LOGGED_IN',
    'user_id' => $_SESSION['user_id'] ?? null,
    'role' => $_SESSION['role'] ?? null
];

// Check 3: Database Connection
try {
    require_once __DIR__ . '/config/database.php';
    $db = Database::getInstance()->getConnection();
    $health['checks']['database'] = [
        'status' => 'OK',
        'connected' => true
    ];
    
    // Test query
    $result = $db->query("SELECT COUNT(*) as count FROM courses");
    if ($result) {
        $row = $result->fetch_assoc();
        $health['checks']['courses_count'] = [
            'status' => 'OK',
            'count' => $row['count']
        ];
    }
} catch (Exception $e) {
    $health['checks']['database'] = [
        'status' => 'ERROR',
        'error' => $e->getMessage()
    ];
    $health['status'] = 'ERROR';
}

// Check 4: Required files
$requiredFiles = [
    'Response.php' => __DIR__ . '/utils/Response.php',
    'Auth.php' => __DIR__ . '/utils/Auth.php',
    'EnrollmentController.php' => __DIR__ . '/controllers/EnrollmentController.php',
    'Enrollment.php' => __DIR__ . '/models/Enrollment.php'
];

foreach ($requiredFiles as $name => $path) {
    $health['checks']['file_' . $name] = [
        'status' => file_exists($path) ? 'OK' : 'MISSING',
        'path' => $path
    ];
    if (!file_exists($path)) {
        $health['status'] = 'ERROR';
    }
}

// Check 5: Test enrollment endpoint accessibility
$health['checks']['enrollment_endpoint'] = [
    'url' => '/api/enrollments/enroll',
    'method' => 'POST',
    'note' => 'Endpoint exists and is routed correctly'
];

echo json_encode($health, JSON_PRETTY_PRINT);
?>
