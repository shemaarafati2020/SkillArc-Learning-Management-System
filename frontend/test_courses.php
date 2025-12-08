<?php
/**
 * Test script to check courses in database
 */

require_once __DIR__ . '/config/database.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Get all courses
    $stmt = $db->query("SELECT course_id, title, status, instructor_id FROM courses ORDER BY course_id DESC LIMIT 10");
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>Courses in Database:</h2>";
    echo "<table border='1' cellpadding='10'>";
    echo "<tr><th>Course ID</th><th>Title</th><th>Status</th><th>Instructor ID</th></tr>";
    
    if (empty($courses)) {
        echo "<tr><td colspan='4'>No courses found in database</td></tr>";
    } else {
        foreach ($courses as $course) {
            echo "<tr>";
            echo "<td>{$course['course_id']}</td>";
            echo "<td>{$course['title']}</td>";
            echo "<td>{$course['status']}</td>";
            echo "<td>{$course['instructor_id']}</td>";
            echo "</tr>";
        }
    }
    
    echo "</table>";
    
    // Check if course 108 exists
    echo "<h3>Checking Course ID 108:</h3>";
    $stmt = $db->prepare("SELECT * FROM courses WHERE course_id = ?");
    $stmt->execute([108]);
    $course108 = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($course108) {
        echo "<p style='color: green;'>✓ Course 108 EXISTS</p>";
        echo "<pre>" . print_r($course108, true) . "</pre>";
    } else {
        echo "<p style='color: red;'>✗ Course 108 DOES NOT EXIST</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>
