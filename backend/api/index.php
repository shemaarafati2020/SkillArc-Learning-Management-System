<?php
/**
 * API Router - Main Entry Point
 * Learning Management System API
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Start session
session_start();

// CORS Headers (centralized configuration)
require_once __DIR__ . '/../config/cors.php';

// Load utilities
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Validator.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/AuditLog.php';
require_once __DIR__ . '/../utils/FileUpload.php';

// Get request info
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

// Parse the URI to get the endpoint
$uri = parse_url($requestUri, PHP_URL_PATH);
$uri = urldecode($uri);

// Remove possible base paths
$basePaths = [
    '/learning management system/backend/api',
    '/learning%20management%20system/backend/api'
];
foreach ($basePaths as $basePath) {
    $uri = str_replace(urldecode($basePath), '', $uri);
}

$uri = trim($uri, '/');
$segments = explode('/', $uri);

$resource = $segments[0] ?? '';
$id = $segments[1] ?? null;
$action = $segments[2] ?? null;

// Route to appropriate controller
try {
    switch ($resource) {
        case 'auth':
            require_once __DIR__ . '/../controllers/AuthController.php';
            $controller = new AuthController();
            break;
            
        case 'users':
            require_once __DIR__ . '/../controllers/UserController.php';
            $controller = new UserController();
            break;
            
        case 'courses':
            require_once __DIR__ . '/../controllers/CourseController.php';
            $controller = new CourseController();
            break;
            
        case 'modules':
            require_once __DIR__ . '/../controllers/ModuleController.php';
            $controller = new ModuleController();
            break;
            
        case 'lessons':
            require_once __DIR__ . '/../controllers/LessonController.php';
            $controller = new LessonController();
            break;
            
        case 'enrollments':
            require_once __DIR__ . '/../controllers/EnrollmentController.php';
            $controller = new EnrollmentController();
            break;
            
        case 'assignments':
            require_once __DIR__ . '/../controllers/AssignmentController.php';
            $controller = new AssignmentController();
            break;
            
        case 'submissions':
            require_once __DIR__ . '/../controllers/SubmissionController.php';
            $controller = new SubmissionController();
            break;
            
        case 'quizzes':
            require_once __DIR__ . '/../controllers/QuizController.php';
            $controller = new QuizController();
            break;
            
        case 'certificates':
            require_once __DIR__ . '/../controllers/CertificateController.php';
            $controller = new CertificateController();
            break;
            
        case 'notifications':
            require_once __DIR__ . '/../controllers/NotificationController.php';
            $controller = new NotificationController();
            break;
            
        case 'forums':
            require_once __DIR__ . '/../controllers/ForumController.php';
            $controller = new ForumController();
            break;
            
        case 'analytics':
            require_once __DIR__ . '/../controllers/AnalyticsController.php';
            $controller = new AnalyticsController();
            break;
            
        case 'settings':
            require_once __DIR__ . '/../controllers/SettingsController.php';
            $controller = new SettingsController();
            break;
            
        case 'audit-logs':
            require_once __DIR__ . '/../controllers/AuditLogController.php';
            $controller = new AuditLogController();
            break;
            
        case 'backup':
            require_once __DIR__ . '/../controllers/BackupController.php';
            $controller = new BackupController();
            break;
            
        default:
            Response::error('Endpoint not found', 404);
    }
    
    // Handle the request
    $controller->handleRequest($requestMethod, $id, $action);
    
} catch (Exception $e) {
    Response::error('Server error: ' . $e->getMessage(), 500);
}
?>
