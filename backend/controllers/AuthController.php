<?php
/**
 * Authentication Controller
 */
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function handleRequest($method, $id, $action) {
        // For auth routes, the action is in the $id position (e.g., /auth/login)
        $action = $action ?? $id;
        switch ($action) {
            case 'login':
                if ($method === 'POST') $this->login();
                break;
            case 'register':
                if ($method === 'POST') $this->register();
                break;
            case 'logout':
                if ($method === 'POST') $this->logout();
                break;
            case 'me':
                if ($method === 'GET') $this->getCurrentUser();
                break;
            case 'change-password':
                if ($method === 'POST') $this->changePassword();
                break;
            case 'avatar':
                if ($method === 'POST') $this->uploadAvatar();
                else Response::error('Method not allowed', 405);
                break;
            default:
                Response::error('Action not found', 404);
        }
    }

    private function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator->required('email')->email('email')->required('password');
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        $user = $this->userModel->findByEmail($data['email']);
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            Response::error('Invalid email or password', 401);
        }

        if (!$user['is_active']) {
            Response::error('Account is deactivated', 403);
        }

        // Update last login
        $this->userModel->updateLastLogin($user['user_id']);
        
        // Start session
        Auth::login($user);
        
        // Log the action
        AuditLog::loginLog($user['user_id']);

        unset($user['password']);
        Response::success($user, 'Login successful');
    }

    private function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('name')->minLength('name', 2)->maxLength('name', 100)
            ->required('email')->email('email')
            ->required('password')->password('password');
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        // Check if email exists
        if ($this->userModel->findByEmail($data['email'])) {
            Response::error('Email already registered', 400);
        }

        $data = Validator::sanitizeArray($data);
        $data['role'] = 'student'; // Default role for registration
        
        $userId = $this->userModel->create($data);
        
        if ($userId) {
            AuditLog::createLog('users', $userId, ['name' => $data['name'], 'email' => $data['email']]);
            
            $user = $this->userModel->findById($userId);
            Auth::login($user);
            
            Response::success($user, 'Registration successful', 201);
        }
        
        Response::error('Registration failed', 500);
    }

    private function logout() {
        $userId = Auth::id();
        if ($userId) {
            AuditLog::logoutLog($userId);
        }
        Auth::logout();
        Response::success(null, 'Logged out successfully');
    }

    private function getCurrentUser() {
        Auth::requireAuth();
        
        $user = $this->userModel->findById(Auth::id());
        if ($user) {
            Response::success($user);
        }
        Response::error('User not found', 404);
    }

    private function changePassword() {
        Auth::requireAuth();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('current_password')
            ->required('new_password')->password('new_password');
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        $user = $this->userModel->findByEmail(Auth::user()['email']);
        
        if (!password_verify($data['current_password'], $user['password'])) {
            Response::error('Current password is incorrect', 400);
        }

        if ($this->userModel->updatePassword(Auth::id(), $data['new_password'])) {
            AuditLog::log('PASSWORD_CHANGE', 'users', Auth::id());
            Response::success(null, 'Password changed successfully');
        }
        
        Response::error('Failed to change password', 500);
    }

    private function uploadAvatar() {
        Auth::requireAuth();

        if (!isset($_FILES['avatar'])) {
            Response::error('No avatar file uploaded', 400);
        }

        $uploader = new FileUpload('uploads/avatars/');
        $uploader->setAllowedTypes(FileUpload::getImageTypes());
        $uploader->setMaxSize(5); // 5 MB

        $result = $uploader->upload($_FILES['avatar']);
        if (!$result) {
            Response::error('Avatar upload failed', 400, $uploader->getErrors());
        }

        $url = $result['url'];
        $userId = Auth::id();

        if ($this->userModel->update($userId, ['avatar_url' => $url])) {
            $user = $this->userModel->findById($userId);
            Response::success($user, 'Avatar updated successfully');
        }

        Response::error('Failed to update avatar', 500);
    }
}
?>
