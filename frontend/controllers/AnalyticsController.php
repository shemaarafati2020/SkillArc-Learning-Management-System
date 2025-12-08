<?php
/**
 * Analytics Controller
 */
require_once __DIR__ . '/../config/database.php';

class AnalyticsController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function handleRequest($method, $id, $action) {
        if ($method !== 'GET') {
            Response::error('Method not allowed', 405);
        }

        switch ($action) {
            case 'dashboard':
                $this->getDashboardStats();
                break;
            case 'course':
                if ($id) $this->getCourseAnalytics($id);
                break;
            case 'student':
                if ($id) $this->getStudentAnalytics($id);
                break;
            case 'instructor':
                if ($id) $this->getInstructorAnalytics($id);
                break;
            case 'enrollments':
                $this->getEnrollmentTrends();
                break;
            case 'completions':
                $this->getCompletionRates();
                break;
            default:
                $this->getDashboardStats();
        }
    }

    private function getDashboardStats() {
        Auth::requireRole(['admin']);
        
        // Total counts
        $stats = [
            'users' => $this->getCount('users'),
            'students' => $this->getCount('users', "role = 'student'"),
            'instructors' => $this->getCount('users', "role = 'instructor'"),
            'courses' => $this->getCount('courses'),
            'published_courses' => $this->getCount('courses', "status = 'published'"),
            'enrollments' => $this->getCount('enrollments'),
            'active_enrollments' => $this->getCount('enrollments', "status = 'active'"),
            'completed_enrollments' => $this->getCount('enrollments', "status = 'completed'"),
            'certificates' => $this->getCount('certificates'),
            'submissions' => $this->getCount('submissions'),
            'quiz_attempts' => $this->getCount('quiz_attempts')
        ];

        // Recent activity
        $stats['recent_enrollments'] = $this->getRecentEnrollments(7);
        $stats['recent_completions'] = $this->getRecentCompletions(7);
        
        // Monthly trends
        $stats['enrollment_trend'] = $this->getMonthlyTrend('enrollments', 'enrolled_at', 6);
        $stats['completion_trend'] = $this->getMonthlyTrend('enrollments', 'completed_at', 6, "status = 'completed'");

        Response::success($stats);
    }

    private function getCourseAnalytics($courseId) {
        Auth::requireRole(['admin', 'instructor']);
        
        $sql = "SELECT 
                (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) as total_enrollments,
                (SELECT COUNT(*) FROM enrollments WHERE course_id = ? AND status = 'completed') as completions,
                (SELECT AVG(progress_percent) FROM enrollments WHERE course_id = ?) as avg_progress,
                (SELECT COUNT(*) FROM modules WHERE course_id = ?) as total_modules,
                (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.module_id WHERE m.course_id = ?) as total_lessons,
                (SELECT COUNT(*) FROM assignments WHERE course_id = ?) as total_assignments,
                (SELECT COUNT(*) FROM quizzes WHERE course_id = ?) as total_quizzes";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iiiiiii', $courseId, $courseId, $courseId, $courseId, $courseId, $courseId, $courseId);
        $stmt->execute();
        $stats = $stmt->get_result()->fetch_assoc();

        // Grade distribution
        $stats['grade_distribution'] = $this->getGradeDistribution($courseId);
        
        // Activity over time
        $stats['enrollment_timeline'] = $this->getCourseEnrollmentTimeline($courseId);

        Response::success($stats);
    }

    private function getStudentAnalytics($studentId) {
        Auth::requireAuth();
        
        // Students can only view their own analytics
        if (!Auth::isAdmin() && Auth::id() != $studentId) {
            Response::forbidden();
        }
        
        $sql = "SELECT 
                (SELECT COUNT(*) FROM enrollments WHERE user_id = ?) as total_enrollments,
                (SELECT COUNT(*) FROM enrollments WHERE user_id = ? AND status = 'completed') as completed_courses,
                (SELECT AVG(progress_percent) FROM enrollments WHERE user_id = ?) as avg_progress,
                (SELECT COUNT(*) FROM submissions WHERE student_id = ?) as total_submissions,
                (SELECT AVG(score) FROM submissions WHERE student_id = ? AND score IS NOT NULL) as avg_submission_score,
                (SELECT COUNT(*) FROM quiz_attempts WHERE student_id = ?) as total_quiz_attempts,
                (SELECT AVG(percentage) FROM quiz_attempts WHERE student_id = ? AND percentage IS NOT NULL) as avg_quiz_score,
                (SELECT COUNT(*) FROM certificates WHERE user_id = ?) as certificates_earned";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iiiiiiii', $studentId, $studentId, $studentId, $studentId, $studentId, $studentId, $studentId, $studentId);
        $stmt->execute();
        $stats = $stmt->get_result()->fetch_assoc();

        // Course progress breakdown
        $stats['course_progress'] = $this->getStudentCourseProgress($studentId);

        Response::success($stats);
    }

    private function getInstructorAnalytics($instructorId) {
        Auth::requireRole(['admin', 'instructor']);
        
        if (!Auth::isAdmin() && Auth::id() != $instructorId) {
            Response::forbidden();
        }
        
        $sql = "SELECT 
                (SELECT COUNT(*) FROM courses WHERE instructor_id = ?) as total_courses,
                (SELECT COUNT(*) FROM courses WHERE instructor_id = ? AND status = 'published') as published_courses,
                (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.course_id WHERE c.instructor_id = ?) as total_students,
                (SELECT COUNT(*) FROM enrollments e JOIN courses c ON e.course_id = c.course_id WHERE c.instructor_id = ? AND e.status = 'completed') as completed_students,
                (SELECT AVG(e.progress_percent) FROM enrollments e JOIN courses c ON e.course_id = c.course_id WHERE c.instructor_id = ?) as avg_student_progress";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('iiiii', $instructorId, $instructorId, $instructorId, $instructorId, $instructorId);
        $stmt->execute();
        $stats = $stmt->get_result()->fetch_assoc();

        // Course performance
        $stats['course_performance'] = $this->getInstructorCoursePerformance($instructorId);

        Response::success($stats);
    }

    private function getEnrollmentTrends() {
        Auth::requireRole(['admin']);
        $trends = $this->getMonthlyTrend('enrollments', 'enrolled_at', 12);
        Response::success($trends);
    }

    private function getCompletionRates() {
        Auth::requireRole(['admin']);
        
        $sql = "SELECT c.title, c.course_id,
                COUNT(e.enroll_id) as total_enrolled,
                SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as completed,
                ROUND(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / COUNT(e.enroll_id) * 100, 2) as completion_rate
                FROM courses c
                LEFT JOIN enrollments e ON c.course_id = e.course_id
                WHERE c.status = 'published'
                GROUP BY c.course_id
                ORDER BY completion_rate DESC
                LIMIT 10";
        
        $result = $this->db->query($sql);
        Response::success($result->fetch_all(MYSQLI_ASSOC));
    }

    // Helper methods
    private function getCount($table, $condition = '1=1') {
        $sql = "SELECT COUNT(*) as count FROM {$table} WHERE {$condition}";
        $result = $this->db->query($sql);
        return $result->fetch_assoc()['count'];
    }

    private function getRecentEnrollments($days) {
        $sql = "SELECT DATE(enrolled_at) as date, COUNT(*) as count 
                FROM enrollments 
                WHERE enrolled_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE(enrolled_at)
                ORDER BY date";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $days);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    private function getRecentCompletions($days) {
        $sql = "SELECT DATE(completed_at) as date, COUNT(*) as count 
                FROM enrollments 
                WHERE status = 'completed' AND completed_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE(completed_at)
                ORDER BY date";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $days);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    private function getMonthlyTrend($table, $dateColumn, $months, $condition = '1=1') {
        $sql = "SELECT DATE_FORMAT({$dateColumn}, '%Y-%m') as month, COUNT(*) as count 
                FROM {$table} 
                WHERE {$dateColumn} >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) AND {$condition}
                GROUP BY month
                ORDER BY month";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $months);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    private function getGradeDistribution($courseId) {
        $sql = "SELECT 
                CASE 
                    WHEN s.score/a.max_score >= 0.9 THEN 'A'
                    WHEN s.score/a.max_score >= 0.8 THEN 'B'
                    WHEN s.score/a.max_score >= 0.7 THEN 'C'
                    WHEN s.score/a.max_score >= 0.6 THEN 'D'
                    ELSE 'F'
                END as grade,
                COUNT(*) as count
                FROM submissions s
                JOIN assignments a ON s.assign_id = a.assign_id
                WHERE a.course_id = ? AND s.score IS NOT NULL
                GROUP BY grade
                ORDER BY grade";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    private function getCourseEnrollmentTimeline($courseId) {
        $sql = "SELECT DATE(enrolled_at) as date, COUNT(*) as count 
                FROM enrollments WHERE course_id = ?
                GROUP BY DATE(enrolled_at) ORDER BY date";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    private function getStudentCourseProgress($studentId) {
        $sql = "SELECT e.*, c.title as course_title 
                FROM enrollments e 
                JOIN courses c ON e.course_id = c.course_id 
                WHERE e.user_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $studentId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    private function getInstructorCoursePerformance($instructorId) {
        $sql = "SELECT c.course_id, c.title,
                COUNT(DISTINCT e.user_id) as students,
                AVG(e.progress_percent) as avg_progress,
                SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as completions
                FROM courses c
                LEFT JOIN enrollments e ON c.course_id = e.course_id
                WHERE c.instructor_id = ?
                GROUP BY c.course_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $instructorId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
}
?>
