<?php
/**
 * File Upload Helper
 */
class FileUpload {
    private $allowedTypes = [];
    private $maxSize = 10485760; // 10MB default
    private $uploadDir = '';
    private $errors = [];

    private $relativeDir = '';

    public function __construct($uploadDir = 'uploads/') {
        $this->relativeDir = $uploadDir;
        $this->uploadDir = __DIR__ . '/../' . $uploadDir;
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }

    public function setAllowedTypes($types) {
        $this->allowedTypes = $types;
        return $this;
    }

    public function setMaxSize($sizeInMB) {
        $this->maxSize = $sizeInMB * 1048576;
        return $this;
    }

    public function upload($file, $customName = null) {
        $this->errors = [];

        if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
            $this->errors[] = 'No file uploaded or upload error';
            return false;
        }

        // Validate file size
        if ($file['size'] > $this->maxSize) {
            $this->errors[] = 'File size exceeds maximum allowed size';
            return false;
        }

        // Get file extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        // Validate file type
        if (!empty($this->allowedTypes) && !in_array($extension, $this->allowedTypes)) {
            $this->errors[] = 'File type not allowed. Allowed types: ' . implode(', ', $this->allowedTypes);
            return false;
        }

        // Generate unique filename
        $filename = $customName ?? uniqid() . '_' . time() . '.' . $extension;
        $filepath = $this->uploadDir . $filename;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $filepath)) {
            // Generate URL relative to project root
            $url = '/learning%20management%20system/backend/' . $this->relativeDir . $filename;
            return [
                'filename' => $filename,
                'filepath' => $filepath,
                'url' => $url,
                'size' => $file['size'],
                'type' => $extension
            ];
        }

        $this->errors[] = 'Failed to move uploaded file';
        return false;
    }

    public function delete($filename) {
        $filepath = $this->uploadDir . $filename;
        if (file_exists($filepath)) {
            return unlink($filepath);
        }
        return false;
    }

    public function getErrors() {
        return $this->errors;
    }

    public static function getImageTypes() {
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    }

    public static function getDocumentTypes() {
        return ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'];
    }

    public static function getVideoTypes() {
        return ['mp4', 'webm', 'ogg', 'mov'];
    }
}
?>
