<?php
/**
 * Quiz Controller
 */
require_once __DIR__ . '/../models/Quiz.php';
require_once __DIR__ . '/../models/Course.php';

class QuizController {
    private $quizModel;
    private $courseModel;

    public function __construct() {
        $this->quizModel = new Quiz();
        $this->courseModel = new Course();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'course' && $id) {
                    $this->getByCourse($id);
                } elseif ($action === 'questions' && $id) {
                    $this->getQuestions($id);
                } elseif ($action === 'attempts' && $id) {
                    $this->getAttempts($id);
                } elseif ($id) {
                    $this->getOne($id);
                }
                break;
            case 'POST':
                if ($action === 'start' && $id) {
                    $this->startAttempt($id);
                } elseif ($action === 'submit' && $id) {
                    $this->submitAttempt($id);
                } elseif ($action === 'question') {
                    $this->addQuestion();
                } else {
                    $this->create();
                }
                break;
            case 'PUT':
                if ($action === 'question' && $id) {
                    $this->updateQuestion($id);
                } elseif ($id) {
                    $this->update($id);
                }
                break;
            case 'DELETE':
                if ($action === 'question' && $id) {
                    $this->deleteQuestion($id);
                } elseif ($id) {
                    $this->delete($id);
                }
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function getByCourse($courseId) {
        $quizzes = $this->quizModel->findByCourse($courseId);
        Response::success($quizzes);
    }

    private function getOne($id) {
        $quiz = $this->quizModel->findById($id);
        if ($quiz) {
            Response::success($quiz);
        }
        Response::notFound('Quiz not found');
    }

    private function getQuestions($quizId) {
        Auth::requireAuth();
        
        $quiz = $this->quizModel->findById($quizId);
        if (!$quiz) {
            Response::notFound('Quiz not found');
        }

        $questions = $this->quizModel->getQuestions($quizId);
        
        // Hide correct answers for students
        if (!Auth::isAdmin() && Auth::id() != $quiz['instructor_id']) {
            foreach ($questions as &$q) {
                unset($q['correct_answer']);
            }
        }
        
        Response::success($questions);
    }

    private function getAttempts($quizId) {
        Auth::requireAuth();
        $attempts = $this->quizModel->getStudentAttempts($quizId, Auth::id());
        Response::success($attempts);
    }

    private function create() {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('course_id')->numeric('course_id')
            ->required('title')->minLength('title', 3);
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        $course = $this->courseModel->findById($data['course_id']);
        if (!$course) {
            Response::notFound('Course not found');
        }
        
        if (!Auth::isAdmin() && Auth::id() != $course['instructor_id']) {
            Response::forbidden();
        }

        $data = Validator::sanitizeArray($data);
        $quizId = $this->quizModel->create($data);
        
        if ($quizId) {
            AuditLog::createLog('quizzes', $quizId, $data);
            $quiz = $this->quizModel->findById($quizId);
            Response::success($quiz, 'Quiz created successfully', 201);
        }
        
        Response::error('Failed to create quiz', 500);
    }

    private function update($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $quiz = $this->quizModel->findById($id);
        if (!$quiz) {
            Response::notFound('Quiz not found');
        }

        if (!Auth::isAdmin() && Auth::id() != $quiz['instructor_id']) {
            Response::forbidden();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeArray($data);
        
        if ($this->quizModel->update($id, $data)) {
            AuditLog::updateLog('quizzes', $id, $quiz, $data);
            $updated = $this->quizModel->findById($id);
            Response::success($updated, 'Quiz updated successfully');
        }
        
        Response::error('Failed to update quiz', 500);
    }

    private function delete($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $quiz = $this->quizModel->findById($id);
        if (!$quiz) {
            Response::notFound('Quiz not found');
        }

        if (!Auth::isAdmin() && Auth::id() != $quiz['instructor_id']) {
            Response::forbidden();
        }

        if ($this->quizModel->delete($id)) {
            AuditLog::deleteLog('quizzes', $id, $quiz);
            Response::success(null, 'Quiz deleted successfully');
        }
        
        Response::error('Failed to delete quiz', 500);
    }

    private function addQuestion() {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('quiz_id')->numeric('quiz_id')
            ->required('question_text')
            ->required('question_type')->in('question_type', ['multiple_choice', 'true_false', 'short_answer'])
            ->required('correct_answer');
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        $quiz = $this->quizModel->findById($data['quiz_id']);
        if (!$quiz) {
            Response::notFound('Quiz not found');
        }

        if (!Auth::isAdmin() && Auth::id() != $quiz['instructor_id']) {
            Response::forbidden();
        }

        $questionId = $this->quizModel->addQuestion($data);
        
        if ($questionId) {
            Response::success(['q_id' => $questionId], 'Question added successfully', 201);
        }
        
        Response::error('Failed to add question', 500);
    }

    private function updateQuestion($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if ($this->quizModel->updateQuestion($id, $data)) {
            Response::success(null, 'Question updated successfully');
        }
        
        Response::error('Failed to update question', 500);
    }

    private function deleteQuestion($id) {
        Auth::requireRole(['admin', 'instructor']);
        
        if ($this->quizModel->deleteQuestion($id)) {
            Response::success(null, 'Question deleted successfully');
        }
        
        Response::error('Failed to delete question', 500);
    }

    private function startAttempt($quizId) {
        Auth::requireAuth();
        
        $quiz = $this->quizModel->findById($quizId);
        if (!$quiz) {
            Response::notFound('Quiz not found');
        }

        if (!$quiz['is_published']) {
            Response::error('Quiz is not available', 400);
        }

        $result = $this->quizModel->startAttempt($quizId, Auth::id());
        
        if (is_array($result) && isset($result['error'])) {
            Response::error($result['error'], 400);
        }

        if ($result) {
            $questions = $this->quizModel->getQuestions($quizId);
            foreach ($questions as &$q) {
                unset($q['correct_answer']);
                if ($q['options_json']) {
                    $q['options'] = json_decode($q['options_json'], true);
                }
            }
            
            Response::success([
                'attempt_id' => $result,
                'quiz' => $quiz,
                'questions' => $questions,
                'duration_minutes' => $quiz['duration_minutes']
            ], 'Quiz started');
        }
        
        Response::error('Failed to start quiz', 500);
    }

    private function submitAttempt($attemptId) {
        Auth::requireAuth();
        
        $attempt = $this->quizModel->getAttempt($attemptId);
        if (!$attempt) {
            Response::notFound('Attempt not found');
        }

        if ($attempt['student_id'] != Auth::id()) {
            Response::forbidden();
        }

        if ($attempt['ended_at']) {
            Response::error('This attempt has already been submitted', 400);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $answers = $data['answers'] ?? [];
        
        $result = $this->quizModel->submitAttempt($attemptId, $answers);
        
        if ($result) {
            AuditLog::log('QUIZ_SUBMIT', 'quiz_attempts', $attemptId, null, $result);
            Response::success($result, 'Quiz submitted successfully');
        }
        
        Response::error('Failed to submit quiz', 500);
    }
}
?>
