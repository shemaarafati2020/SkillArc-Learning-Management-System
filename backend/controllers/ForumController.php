<?php
/**
 * Forum Controller
 */
require_once __DIR__ . '/../models/Forum.php';
require_once __DIR__ . '/../models/Course.php';
require_once __DIR__ . '/../models/Enrollment.php';

class ForumController {
    private $forumModel;
    private $courseModel;
    private $enrollmentModel;

    public function __construct() {
        $this->forumModel = new Forum();
        $this->courseModel = new Course();
        $this->enrollmentModel = new Enrollment();
    }

    public function handleRequest($method, $id, $action) {
        switch ($method) {
            case 'GET':
                if ($action === 'course' && $id) {
                    $this->getByCourse($id);
                } elseif ($action === 'threads' && $id) {
                    $this->getThreads($id);
                } elseif ($action === 'thread' && $id) {
                    $this->getThread($id);
                } elseif ($action === 'replies' && $id) {
                    $this->getReplies($id);
                }
                break;
            case 'POST':
                if ($action === 'thread') {
                    $this->createThread();
                } elseif ($action === 'reply') {
                    $this->createReply();
                } elseif ($action === 'forum') {
                    $this->createForum();
                } elseif ($action === 'solution' && $id) {
                    $this->markSolution($id);
                }
                break;
            case 'PUT':
                if ($action === 'thread' && $id) {
                    $this->updateThread($id);
                } elseif ($action === 'reply' && $id) {
                    $this->updateReply($id);
                }
                break;
            case 'DELETE':
                if ($action === 'thread' && $id) {
                    $this->deleteThread($id);
                } elseif ($action === 'reply' && $id) {
                    $this->deleteReply($id);
                }
                break;
            default:
                Response::error('Method not allowed', 405);
        }
    }

    private function getByCourse($courseId) {
        Auth::requireAuth();
        $forums = $this->forumModel->findByCourse($courseId);
        Response::success($forums);
    }

    private function getThreads($forumId) {
        Auth::requireAuth();
        
        $limit = $_GET['limit'] ?? 20;
        $offset = $_GET['offset'] ?? 0;
        
        $threads = $this->forumModel->getThreads($forumId, $limit, $offset);
        Response::success($threads);
    }

    private function getThread($threadId) {
        Auth::requireAuth();
        
        $thread = $this->forumModel->getThread($threadId);
        if (!$thread) {
            Response::notFound('Thread not found');
        }

        $this->forumModel->incrementViewCount($threadId);
        $thread['replies'] = $this->forumModel->getReplies($threadId);
        
        Response::success($thread);
    }

    private function getReplies($threadId) {
        Auth::requireAuth();
        $replies = $this->forumModel->getReplies($threadId);
        Response::success($replies);
    }

    private function createForum() {
        Auth::requireRole(['admin', 'instructor']);
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('course_id')->numeric('course_id')
            ->required('title');
        
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

        $forumId = $this->forumModel->createForum($data['course_id'], $data['title'], $data['description'] ?? null);
        
        if ($forumId) {
            Response::success(['forum_id' => $forumId], 'Forum created', 201);
        }
        
        Response::error('Failed to create forum', 500);
    }

    private function createThread() {
        Auth::requireAuth();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('forum_id')->numeric('forum_id')
            ->required('title')->minLength('title', 5)
            ->required('content')->minLength('content', 10);
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        $data = Validator::sanitizeArray($data);
        $threadId = $this->forumModel->createThread($data['forum_id'], Auth::id(), $data['title'], $data['content']);
        
        if ($threadId) {
            $thread = $this->forumModel->getThread($threadId);
            Response::success($thread, 'Thread created', 201);
        }
        
        Response::error('Failed to create thread', 500);
    }

    private function updateThread($threadId) {
        Auth::requireAuth();
        
        $thread = $this->forumModel->getThread($threadId);
        if (!$thread) {
            Response::notFound('Thread not found');
        }

        // Only author, instructor, or admin can update
        $course = $this->courseModel->findById($thread['course_id']);
        if (Auth::id() != $thread['user_id'] && Auth::id() != $course['instructor_id'] && !Auth::isAdmin()) {
            Response::forbidden();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data = Validator::sanitizeArray($data);
        
        if ($this->forumModel->updateThread($threadId, $data)) {
            Response::success(null, 'Thread updated');
        }
        
        Response::error('Failed to update thread', 500);
    }

    private function deleteThread($threadId) {
        Auth::requireAuth();
        
        $thread = $this->forumModel->getThread($threadId);
        if (!$thread) {
            Response::notFound('Thread not found');
        }

        $course = $this->courseModel->findById($thread['course_id']);
        if (Auth::id() != $thread['user_id'] && Auth::id() != $course['instructor_id'] && !Auth::isAdmin()) {
            Response::forbidden();
        }

        if ($this->forumModel->deleteThread($threadId)) {
            Response::success(null, 'Thread deleted');
        }
        
        Response::error('Failed to delete thread', 500);
    }

    private function createReply() {
        Auth::requireAuth();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        $validator = new Validator($data);
        $validator
            ->required('thread_id')->numeric('thread_id')
            ->required('content')->minLength('content', 2);
        
        if (!$validator->isValid()) {
            Response::error('Validation failed', 400, $validator->getErrors());
        }

        $thread = $this->forumModel->getThread($data['thread_id']);
        if (!$thread) {
            Response::notFound('Thread not found');
        }

        if ($thread['is_locked']) {
            Response::error('Thread is locked', 400);
        }

        $data = Validator::sanitizeArray($data);
        $replyId = $this->forumModel->createReply($data['thread_id'], Auth::id(), $data['content']);
        
        if ($replyId) {
            Response::success(['reply_id' => $replyId], 'Reply posted', 201);
        }
        
        Response::error('Failed to post reply', 500);
    }

    private function updateReply($replyId) {
        Auth::requireAuth();
        
        $reply = $this->forumModel->getReply($replyId);
        if (!$reply) {
            Response::notFound('Reply not found');
        }

        if (Auth::id() != $reply['user_id'] && !Auth::isAdmin()) {
            Response::forbidden();
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if ($this->forumModel->updateReply($replyId, Validator::sanitize($data['content']))) {
            Response::success(null, 'Reply updated');
        }
        
        Response::error('Failed to update reply', 500);
    }

    private function deleteReply($replyId) {
        Auth::requireAuth();
        
        $reply = $this->forumModel->getReply($replyId);
        if (!$reply) {
            Response::notFound('Reply not found');
        }

        $course = $this->courseModel->findById($reply['course_id']);
        if (Auth::id() != $reply['user_id'] && Auth::id() != $course['instructor_id'] && !Auth::isAdmin()) {
            Response::forbidden();
        }

        if ($this->forumModel->deleteReply($replyId)) {
            Response::success(null, 'Reply deleted');
        }
        
        Response::error('Failed to delete reply', 500);
    }

    private function markSolution($replyId) {
        Auth::requireAuth();
        
        $reply = $this->forumModel->getReply($replyId);
        if (!$reply) {
            Response::notFound('Reply not found');
        }

        // Only thread author or instructor can mark solution
        if (Auth::id() != $reply['thread_author_id'] && !Auth::isInstructor() && !Auth::isAdmin()) {
            Response::forbidden();
        }

        if ($this->forumModel->markAsSolution($replyId)) {
            Response::success(null, 'Marked as solution');
        }
        
        Response::error('Failed to mark as solution', 500);
    }
}
?>
