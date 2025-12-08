<!DOCTYPE html>
<html>
<head>
    <title>Quick Enrollment Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1976d2; }
        .status { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        button { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #1565c0; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        input, select { padding: 10px; margin: 10px 0; width: 100%; box-sizing: border-box; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #1976d2; color: white; }
        tr:hover { background: #f5f5f5; }
        .btn-enroll { background: #4caf50; padding: 8px 16px; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .btn-enroll:hover { background: #45a049; }
        .enrolled { color: #4caf50; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 Quick Enrollment Test</h1>
        
        <?php
        session_start();
        require_once __DIR__ . '/config/database.php';
        require_once __DIR__ . '/models/Course.php';
        require_once __DIR__ . '/models/Enrollment.php';
        
        // Check if user is logged in
        if (!isset($_SESSION['user_id'])) {
            echo '<div class="status error">❌ You are not logged in. Please <a href="../frontend/public/index.html">log in</a> first.</div>';
            exit;
        }
        
        $userId = $_SESSION['user_id'];
        $userRole = $_SESSION['role'] ?? 'unknown';
        
        echo '<div class="status info">';
        echo "✓ Logged in as User ID: <strong>$userId</strong> (Role: <strong>$userRole</strong>)";
        echo '</div>';
        
        // Handle enrollment request
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['enroll_course_id'])) {
            $courseId = (int)$_POST['enroll_course_id'];
            
            try {
                $courseModel = new Course();
                $enrollmentModel = new Enrollment();
                
                $course = $courseModel->findById($courseId);
                
                if (!$course) {
                    echo '<div class="status error">❌ Course not found</div>';
                } elseif ($course['status'] !== 'published') {
                    echo '<div class="status error">❌ Course is not published (Status: ' . $course['status'] . ')</div>';
                } elseif ($enrollmentModel->isEnrolled($userId, $courseId)) {
                    echo '<div class="status warning">⚠ You are already enrolled in this course</div>';
                } else {
                    $enrollId = $enrollmentModel->create($userId, $courseId);
                    if ($enrollId) {
                        echo '<div class="status success">✅ Successfully enrolled! Enrollment ID: ' . $enrollId . '</div>';
                        echo '<script>setTimeout(() => window.location.reload(), 2000);</script>';
                    } else {
                        echo '<div class="status error">❌ Database error during enrollment</div>';
                    }
                }
            } catch (Exception $e) {
                echo '<div class="status error">❌ Exception: ' . htmlspecialchars($e->getMessage()) . '</div>';
            }
        }
        
        // Get all published courses
        try {
            $db = Database::getInstance()->getConnection();
            $courseModel = new Course();
            $enrollmentModel = new Enrollment();
            
            $result = $db->query("SELECT course_id, title, description, status, instructor_name, price, max_students 
                                FROM courses 
                                ORDER BY status DESC, course_id DESC");
            $courses = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $courses[] = $row;
                }
            }
            
            if (empty($courses)) {
                echo '<div class="status warning">⚠ No courses found in database</div>';
            } else {
                echo '<h2>Available Courses</h2>';
                echo '<table>';
                echo '<tr><th>ID</th><th>Title</th><th>Status</th><th>Instructor</th><th>Price</th><th>Action</th></tr>';
                
                foreach ($courses as $course) {
                    $isEnrolled = $enrollmentModel->isEnrolled($userId, $course['course_id']);
                    $statusColor = $course['status'] === 'published' ? 'green' : 'orange';
                    
                    echo '<tr>';
                    echo '<td>' . $course['course_id'] . '</td>';
                    echo '<td><strong>' . htmlspecialchars($course['title']) . '</strong></td>';
                    echo '<td style="color: ' . $statusColor . ';">' . $course['status'] . '</td>';
                    echo '<td>' . htmlspecialchars($course['instructor_name'] ?? 'Unknown') . '</td>';
                    echo '<td>$' . number_format($course['price'] ?? 0, 2) . '</td>';
                    echo '<td>';
                    
                    if ($isEnrolled) {
                        echo '<span class="enrolled">✓ Enrolled</span>';
                    } elseif ($course['status'] === 'published') {
                        echo '<form method="POST" style="margin: 0;">';
                        echo '<input type="hidden" name="enroll_course_id" value="' . $course['course_id'] . '">';
                        echo '<button type="submit" class="btn-enroll">Enroll Now</button>';
                        echo '</form>';
                    } else {
                        echo '<span style="color: #999;">Not Published</span>';
                    }
                    
                    echo '</td>';
                    echo '</tr>';
                }
                
                echo '</table>';
            }
            
            // Show current enrollments
            echo '<h2>My Enrollments</h2>';
            $myEnrollments = $enrollmentModel->findByUser($userId);
            
            if (empty($myEnrollments)) {
                echo '<div class="status info">You are not enrolled in any courses yet.</div>';
            } else {
                echo '<table>';
                echo '<tr><th>Course</th><th>Status</th><th>Progress</th><th>Enrolled Date</th></tr>';
                foreach ($myEnrollments as $enrollment) {
                    echo '<tr>';
                    echo '<td>' . htmlspecialchars($enrollment['course_title']) . '</td>';
                    echo '<td>' . $enrollment['status'] . '</td>';
                    echo '<td>' . number_format($enrollment['progress_percent'], 1) . '%</td>';
                    echo '<td>' . date('M d, Y', strtotime($enrollment['enrollment_date'])) . '</td>';
                    echo '</tr>';
                }
                echo '</table>';
            }
            
        } catch (Exception $e) {
            echo '<div class="status error">Database Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
        ?>
        
        <hr style="margin: 30px 0;">
        <p><a href="../frontend/public/index.html">← Back to Application</a></p>
    </div>
</body>
</html>
