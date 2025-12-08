<?php
/**
 * Authentication Helper
 */
require_once __DIR__ . '/../config/database.php';

class Auth {
    public static function startSession() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function login($user) {
        self::startSession();
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
    }

    public static function logout() {
        self::startSession();
        session_unset();
        session_destroy();
    }

    public static function check() {
        self::startSession();
        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }

    public static function user() {
        self::startSession();
        if (!self::check()) {
            return null;
        }
        return [
            'user_id' => $_SESSION['user_id'] ?? null,
            'email' => $_SESSION['email'] ?? null,
            'role' => $_SESSION['role'] ?? null,
            'name' => $_SESSION['name'] ?? null
        ];
    }

    public static function id() {
        self::startSession();
        return $_SESSION['user_id'] ?? null;
    }

    public static function role() {
        self::startSession();
        return $_SESSION['role'] ?? null;
    }

    public static function isAdmin() {
        return self::role() === 'admin';
    }

    public static function isInstructor() {
        return self::role() === 'instructor';
    }

    public static function isStudent() {
        return self::role() === 'student';
    }

    public static function requireAuth() {
        if (!self::check()) {
            Response::unauthorized('Please login to access this resource');
        }
    }

    public static function requireRole($roles) {
        self::requireAuth();
        if (!is_array($roles)) {
            $roles = [$roles];
        }
        if (!in_array(self::role(), $roles)) {
            Response::forbidden('You do not have permission to access this resource');
        }
    }

    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
}
?>
