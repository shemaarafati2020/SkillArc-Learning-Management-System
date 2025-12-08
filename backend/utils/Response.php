<?php
/**
 * Response Helper Class
 */
class Response {
    public static function json($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
        exit();
    }

    public static function success($data = null, $message = 'Success', $statusCode = 200) {
        self::json([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    public static function error($message = 'Error', $statusCode = 400, $errors = null) {
        self::json([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $statusCode);
    }

    public static function unauthorized($message = 'Unauthorized access') {
        self::error($message, 401);
    }

    public static function forbidden($message = 'Access forbidden') {
        self::error($message, 403);
    }

    public static function notFound($message = 'Resource not found') {
        self::error($message, 404);
    }
}
?>
