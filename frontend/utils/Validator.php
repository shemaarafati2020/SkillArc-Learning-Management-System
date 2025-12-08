<?php
/**
 * Input Validation Helper
 */
class Validator {
    private $errors = [];
    private $data = [];

    public function __construct($data) {
        $this->data = $data;
    }

    public function required($field, $message = null) {
        if (!isset($this->data[$field]) || trim($this->data[$field]) === '') {
            $this->errors[$field] = $message ?? "$field is required";
        }
        return $this;
    }

    public function email($field, $message = null) {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = $message ?? "Invalid email format";
        }
        return $this;
    }

    public function minLength($field, $length, $message = null) {
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $length) {
            $this->errors[$field] = $message ?? "$field must be at least $length characters";
        }
        return $this;
    }

    public function maxLength($field, $length, $message = null) {
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $length) {
            $this->errors[$field] = $message ?? "$field must not exceed $length characters";
        }
        return $this;
    }

    public function password($field, $message = null) {
        if (isset($this->data[$field])) {
            $password = $this->data[$field];
            if (strlen($password) < 8 || 
                !preg_match('/[A-Z]/', $password) || 
                !preg_match('/[a-z]/', $password) || 
                !preg_match('/[0-9]/', $password) ||
                !preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
                $this->errors[$field] = $message ?? "Password must be at least 8 characters with uppercase, lowercase, number and special character";
            }
        }
        return $this;
    }

    public function numeric($field, $message = null) {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = $message ?? "$field must be a number";
        }
        return $this;
    }

    public function in($field, $values, $message = null) {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $values)) {
            $this->errors[$field] = $message ?? "$field must be one of: " . implode(', ', $values);
        }
        return $this;
    }

    public function date($field, $message = null) {
        if (isset($this->data[$field]) && !strtotime($this->data[$field])) {
            $this->errors[$field] = $message ?? "Invalid date format for $field";
        }
        return $this;
    }

    public function isValid() {
        return empty($this->errors);
    }

    public function getErrors() {
        return $this->errors;
    }

    public static function sanitize($value) {
        if (is_array($value)) {
            return array_map([self::class, 'sanitize'], $value);
        }
        return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
    }

    public static function sanitizeArray($data) {
        $sanitized = [];
        foreach ($data as $key => $value) {
            $sanitized[$key] = self::sanitize($value);
        }
        return $sanitized;
    }
}
?>
