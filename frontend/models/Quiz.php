<?php
/**
 * Quiz Model
 */
require_once __DIR__ . '/../config/database.php';

class Quiz {
    private $db;
    private $table = 'quizzes';

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function findByCourse($courseId) {
        $sql = "SELECT q.*, 
                (SELECT COUNT(*) FROM questions WHERE quiz_id = q.quiz_id) as question_count
                FROM {$this->table} q 
                WHERE q.course_id = ? 
                ORDER BY q.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function findById($id) {
        $sql = "SELECT q.*, c.title as course_title, c.instructor_id
                FROM {$this->table} q 
                JOIN courses c ON q.course_id = c.course_id
                WHERE q.quiz_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function create($data) {
        $sql = "INSERT INTO {$this->table} (course_id, lesson_id, title, description, duration_minutes, passing_score, max_attempts, is_published) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        $courseId = $data['course_id'];
        $lessonId = $data['lesson_id'] ?? null;
        $title = $data['title'];
        $description = $data['description'] ?? null;
        $duration = $data['duration_minutes'] ?? 30;
        $passingScore = $data['passing_score'] ?? 60;
        $maxAttempts = $data['max_attempts'] ?? 3;
        $isPublished = $data['is_published'] ?? 0;
        
        $stmt->bind_param('iissidii', $courseId, $lessonId, $title, $description, $duration, $passingScore, $maxAttempts, $isPublished);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function update($id, $data) {
        $fields = [];
        $params = [];
        $types = '';

        $allowedFields = ['title', 'description', 'duration_minutes', 'passing_score', 'max_attempts', 'is_published', 'shuffle_questions'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
                if (in_array($field, ['duration_minutes', 'max_attempts', 'is_published', 'shuffle_questions'])) {
                    $types .= 'i';
                } elseif ($field === 'passing_score') {
                    $types .= 'd';
                } else {
                    $types .= 's';
                }
            }
        }

        if (empty($fields)) return false;

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE quiz_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        return $stmt->execute();
    }

    public function delete($id) {
        $sql = "DELETE FROM {$this->table} WHERE quiz_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    // Questions
    public function getQuestions($quizId) {
        $sql = "SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $quizId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function addQuestion($data) {
        $sql = "INSERT INTO questions (quiz_id, question_text, question_type, options_json, correct_answer, points) 
                VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        
        $quizId = $data['quiz_id'];
        $text = $data['question_text'];
        $type = $data['question_type'];
        $options = is_array($data['options_json']) ? json_encode($data['options_json']) : $data['options_json'];
        $answer = $data['correct_answer'];
        $points = $data['points'] ?? 1;
        
        $stmt->bind_param('issssd', $quizId, $text, $type, $options, $answer, $points);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function updateQuestion($id, $data) {
        $fields = [];
        $params = [];
        $types = '';

        if (isset($data['question_text'])) {
            $fields[] = "question_text = ?";
            $params[] = $data['question_text'];
            $types .= 's';
        }
        if (isset($data['options_json'])) {
            $fields[] = "options_json = ?";
            $params[] = is_array($data['options_json']) ? json_encode($data['options_json']) : $data['options_json'];
            $types .= 's';
        }
        if (isset($data['correct_answer'])) {
            $fields[] = "correct_answer = ?";
            $params[] = $data['correct_answer'];
            $types .= 's';
        }
        if (isset($data['points'])) {
            $fields[] = "points = ?";
            $params[] = $data['points'];
            $types .= 'd';
        }

        if (empty($fields)) return false;

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE questions SET " . implode(', ', $fields) . " WHERE q_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param($types, ...$params);
        return $stmt->execute();
    }

    public function deleteQuestion($id) {
        $sql = "DELETE FROM questions WHERE q_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $id);
        return $stmt->execute();
    }

    // Attempts
    public function startAttempt($quizId, $studentId) {
        // Check max attempts
        $quiz = $this->findById($quizId);
        $attempts = $this->getAttemptCount($quizId, $studentId);
        
        if ($attempts >= $quiz['max_attempts']) {
            return ['error' => 'Maximum attempts reached'];
        }

        $sql = "INSERT INTO quiz_attempts (quiz_id, student_id, ip_address) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $stmt->bind_param('iis', $quizId, $studentId, $ip);
        
        if ($stmt->execute()) {
            return $this->db->insert_id;
        }
        return false;
    }

    public function submitAttempt($attemptId, $answers) {
        $attempt = $this->getAttempt($attemptId);
        if (!$attempt) return false;

        $quiz = $this->findById($attempt['quiz_id']);
        $questions = $this->getQuestions($attempt['quiz_id']);
        
        $totalPoints = 0;
        $earnedPoints = 0;

        foreach ($questions as $question) {
            $totalPoints += $question['points'];
            $studentAnswer = $answers[$question['q_id']] ?? null;
            $isCorrect = $this->checkAnswer($question, $studentAnswer);
            $pointsEarned = $isCorrect ? $question['points'] : 0;
            $earnedPoints += $pointsEarned;

            // Save answer
            $sql = "INSERT INTO quiz_answers (attempt_id, question_id, answer_text, is_correct, points_earned) VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $answerText = is_array($studentAnswer) ? json_encode($studentAnswer) : $studentAnswer;
            $stmt->bind_param('iisid', $attemptId, $question['q_id'], $answerText, $isCorrect, $pointsEarned);
            $stmt->execute();
        }

        $percentage = $totalPoints > 0 ? ($earnedPoints / $totalPoints) * 100 : 0;
        $passed = $percentage >= $quiz['passing_score'] ? 1 : 0;

        // Check for suspicious activity
        $timeTaken = time() - strtotime($attempt['started_at']);
        $isSuspicious = $timeTaken < 10 ? 1 : 0; // Less than 10 seconds is suspicious

        $sql = "UPDATE quiz_attempts SET ended_at = CURRENT_TIMESTAMP, score = ?, total_points = ?, 
                percentage = ?, passed = ?, is_suspicious = ?, time_spent_seconds = ? WHERE attempt_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('dddiiiii', $earnedPoints, $totalPoints, $percentage, $passed, $isSuspicious, $timeTaken, $attemptId);
        $stmt->execute();

        return [
            'score' => $earnedPoints,
            'total' => $totalPoints,
            'percentage' => $percentage,
            'passed' => $passed
        ];
    }

    private function checkAnswer($question, $answer) {
        if ($answer === null) return false;
        
        $correct = $question['correct_answer'];
        
        switch ($question['question_type']) {
            case 'true_false':
            case 'multiple_choice':
                return strtolower(trim($answer)) === strtolower(trim($correct));
            case 'short_answer':
                return stripos($answer, $correct) !== false;
            default:
                return false;
        }
    }

    public function getAttempt($attemptId) {
        $sql = "SELECT * FROM quiz_attempts WHERE attempt_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('i', $attemptId);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }

    public function getAttemptCount($quizId, $studentId) {
        $sql = "SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $quizId, $studentId);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        return $result['count'];
    }

    public function getStudentAttempts($quizId, $studentId) {
        $sql = "SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY started_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param('ii', $quizId, $studentId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
}
?>
