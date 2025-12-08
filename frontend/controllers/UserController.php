<?php
/**
 * User Controller
 */
require_once __DIR__ . '/../models/User.php';

class UserController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'instructors') {
                    $this->getInstructors();
                } elseif ($action === 'students') {
                    $this->getStudents();
                } elseif ($id) {
                    $this->getOne($id);
                } else {
                    $this->getAll();
                }
                break;
            case 'POST':
                $this->create();
                break;
            case 'PUT':
                if ($id) $this->update($id);
                break;
            case 'DELETE':
                if ($id) $this->delete($id);
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function getAll() {
        Auth::requireRole(['admin']);
        
        $filters = [
            'role' => $_GET['role'] ?? null,
            'search' => $_GET['search'] ?? null,
            'is_active' => isset($_GET['is_active']) ? (int)$_GET['is_active'] : null,
            'limit' => $_GET['limit'] ?? 50,
            'offset' => $_GET['offset'] ?? 0
        ];
        
        $users = $this->userModel->findAll(array_filter($filters, fn($v) => $v !== null));
        $total = $this->userModel->count($filters);
        
        Response::success([
            'users' => $users,
            'total' => $total,
            'limit' => (int)$filters['limit'],
            'offset' => (int)$filters['offset']
        ]);
    }

    private function getOne($id) {
        Auth::requireAuth();
        
        // Users can view their own profile, admins can view any
        if (Auth::id() != $id && !Auth::isAdmin()) {
            Response::forbidden();
        }
        
        $user = $this->userModel->findById($id);
        if ($user) {
            Response::success($user);
        }
        Response::notFound('User not found');
    }

    private function getInstructors() {
        Auth::requireAuth();
        $instructors = $this->userModel->getInstructors();
        Response::success($instructors);
    }

    private function getStudents() {
        Auth::requireRole(['admin', 'instructor']);
        $students = $this->userModel->getStudents();
        Response::success($students);
    }

    private function create() {
        Auth::requireRole(['admin']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('name')->minLength('name', 2)
            ->required('email')->email('email')
            ->required('password')->password('password')
            ->required('role')->in('role', ['student', 'instructor', 'admin']);
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        if ($this->userModel->findByEmail($data['email'])) {
            Response::error('Email already exists', 400);
        }

        $data = Validator::sanitizeArray($data);
        $userId = $this->userModel->create($data);
        
        if ($userId) {
            AuditLog::createLog('users', $userId, $data);
            $user = $this->userModel->findById($userId);
            Response::success($user, 'User created successfully', 201);
        }
        
        Response::error('Failed to create user', 500);
    }

    private function update($id) {
        Auth::requireAuth();
        
        // Users can update their own profile, admins can update any
        if (Auth::id() != $id && !Auth::isAdmin()) {
            Response::forbidden();
        }
        
        $existingUser = $this->userModel->findById($id);
        if (!$existingUser) {
            Response::notFound('User not found');
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        // Only admin can change roles
        if (isset($data['role']) && !Auth::isAdmin()) {
            unset($data['role']);
        }

        $data = Validator::sanitizeArray($data);
        
        if ($this->userModel->update($id, $data)) {
            AuditLog::updateLog('users', $id, $existingUser, $data);
            $user = $this->userModel->findById($id);
            Response::success($user, 'User updated successfully');
        }
        
        Response::error('Failed to update user', 500);
    }

    private function delete($id) {
        Auth::requireRole(['admin']);
        
        $user = $this->userModel->findById($id);
        if (!$user) {
            Response::notFound('User not found');
        }

        // Prevent self-deletion
        if (Auth::id() == $id) {
            Response::error('Cannot delete your own account', 400);
        }

        if ($this->userModel->delete($id)) {
            AuditLog::deleteLog('users', $id, $user);
            Response::success(null, 'User deleted successfully');
        }
        
        Response::error('Failed to delete user', 500);
    }
}
?>
