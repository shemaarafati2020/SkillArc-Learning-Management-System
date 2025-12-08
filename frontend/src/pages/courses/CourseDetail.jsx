import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Stack,
  Avatar,
  CircularProgress,
  Button,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  MenuItem,
} from '@mui/material';
import {
  AccessTime,
  People,
  School,
  Star,
  Assignment,
  Quiz,
  Forum,
  VideoLibrary,
  Description,
  Add,
  Publish,
  Unpublished,
  CheckCircleRounded,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { coursesAPI, assignmentsAPI, quizzesAPI, forumsAPI, modulesAPI, lessonsAPI, enrollmentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { user, isAdmin, isInstructor } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  
  // Dialog states
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [forumDialogOpen, setForumDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  
  // Form states
  const [assignmentData, setAssignmentData] = useState({ title: '', description: '', due_date: '', max_score: 100, instructions: '', attachment_file: null });
  const [quizData, setQuizData] = useState({ title: '', description: '', duration_minutes: 30, passing_score: 60, max_attempts: 3, shuffle_questions: true });
  const [forumData, setForumData] = useState({ title: '', description: '', category: 'general' });
  const [moduleData, setModuleData] = useState({ title: '', description: '', video_url: '', video_file: null });
  const [lessonData, setLessonData] = useState({ title: '', description: '', content_type: 'pdf', document_file: null, content_url: '' });
  const [videoUploadMethod, setVideoUploadMethod] = useState('url'); // 'url' or 'upload'
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [forums, setForums] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [contentView, setContentView] = useState('overview'); // 'overview', 'modules', 'lessons', 'assignments', 'quizzes', 'forums'
  
  // Enrollment states
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await coursesAPI.getById(id);
        if (res?.data?.success) {
          setCourse(res.data.data);
        } else {
          enqueueSnackbar(res?.data?.message || 'Failed to load course', {
            variant: 'error',
          });
        }
      } catch (error) {
        console.error('Error loading course:', error);
        enqueueSnackbar('Error loading course details', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourse();
      fetchAllContent();
      checkEnrollmentStatus();
    }
  }, [id, enqueueSnackbar]);

  const checkEnrollmentStatus = async () => {
    if (!id || isAdmin || isInstructor) {
      setCheckingEnrollment(false);
      return;
    }
    
    try {
      const response = await enrollmentsAPI.checkEnrollment(id);
      if (response?.data?.success) {
        setIsEnrolled(response.data.data?.is_enrolled || false);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
    } finally {
      setCheckingEnrollment(false);
    }
  };

  const handleEnroll = async () => {
    if (!id) return;
    
    setEnrolling(true);
    try {
      const response = await enrollmentsAPI.enroll(id);
      console.log('Enrollment response:', response);
      
      if (response?.data?.success) {
        enqueueSnackbar('Successfully enrolled in course!', { variant: 'success' });
        setIsEnrolled(true);
        // Optionally reload to show enrolled content
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const errorMsg = response?.data?.message || response?.data?.error || 'Failed to enroll in course';
        console.error('Enrollment failed:', errorMsg, response?.data);
        enqueueSnackbar(errorMsg, { variant: 'error' });
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Error enrolling in course';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setEnrolling(false);
    }
  };

  const handleTogglePublish = async () => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    setPublishing(true);
    try {
      const res = await coursesAPI.update(id, { status: newStatus });
      if (res?.data?.success) {
        setCourse({ ...course, status: newStatus });
        enqueueSnackbar(`Course ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`, { variant: 'success' });
      } else {
        enqueueSnackbar('Failed to update course status', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error updating course status:', error);
      enqueueSnackbar('Error updating course status', { variant: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!assignmentData.title.trim()) {
      enqueueSnackbar('Assignment title is required', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await assignmentsAPI.create({ ...assignmentData, course_id: id, is_published: false });
      if (res?.data?.success) {
        enqueueSnackbar('Assignment created successfully!', { variant: 'success' });
        setAssignmentDialogOpen(false);
        setAssignmentData({ title: '', description: '', due_date: '', max_score: 100, instructions: '', attachment_file: null });
        fetchAllContent();
      } else {
        enqueueSnackbar('Failed to create assignment', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error creating assignment', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!quizData.title.trim()) {
      enqueueSnackbar('Quiz title is required', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await quizzesAPI.create({ ...quizData, course_id: id, is_published: false });
      if (res?.data?.success) {
        enqueueSnackbar('Quiz created successfully!', { variant: 'success' });
        setQuizDialogOpen(false);
        setQuizData({ title: '', description: '', duration_minutes: 30, passing_score: 60, max_attempts: 3, shuffle_questions: true });
        fetchAllContent();
      } else {
        enqueueSnackbar('Failed to create quiz', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error creating quiz', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateForum = async () => {
    if (!forumData.title.trim()) {
      enqueueSnackbar('Forum title is required', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await forumsAPI.createForum({ ...forumData, course_id: id });
      if (res?.data?.success) {
        enqueueSnackbar('Forum created successfully!', { variant: 'success' });
        setForumDialogOpen(false);
        setForumData({ title: '', description: '', category: 'general' });
        fetchAllContent();
      } else {
        enqueueSnackbar('Failed to create forum', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error creating forum', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateModule = async () => {
    if (!moduleData.title.trim()) {
      enqueueSnackbar('Module title is required', { variant: 'warning' });
      return;
    }
    if (videoUploadMethod === 'url' && !moduleData.video_url.trim()) {
      enqueueSnackbar('Please provide a video URL', { variant: 'warning' });
      return;
    }
    if (videoUploadMethod === 'upload' && !moduleData.video_file) {
      enqueueSnackbar('Please select a video file to upload', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      // For now, we'll just create the module with the URL
      // In production, you'd upload the video file to a server/cloud storage first
      const payload = {
        title: moduleData.title,
        description: moduleData.description,
        course_id: id,
        is_published: false,
      };
      const res = await modulesAPI.create(payload);
      if (res?.data?.success) {
        enqueueSnackbar('Module created successfully! Add lessons to this module.', { variant: 'success' });
        setModuleDialogOpen(false);
        setModuleData({ title: '', description: '', video_url: '', video_file: null });
        setVideoUploadMethod('url');
        fetchAllContent(); // Refresh all content
      } else {
        enqueueSnackbar('Failed to create module', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error creating module', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await modulesAPI.getByCourse(id);
      if (res?.data?.success) {
        setModules(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const res = await lessonsAPI.getByCourse(id);
      if (res?.data?.success) {
        setLessons(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await assignmentsAPI.getByCourse(id);
      if (res?.data?.success) {
        setAssignments(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const res = await quizzesAPI.getByCourse(id);
      if (res?.data?.success) {
        setQuizzes(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  const fetchForums = async () => {
    try {
      const res = await forumsAPI.getByCourse(id);
      if (res?.data?.success) {
        setForums(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching forums:', error);
    }
  };

  const fetchAllContent = () => {
    fetchModules();
    fetchLessons();
    fetchAssignments();
    fetchQuizzes();
    fetchForums();
  };

  const handleCreateLesson = async () => {
    if (!lessonData.title.trim()) {
      enqueueSnackbar('Lesson title is required', { variant: 'warning' });
      return;
    }
    if (!lessonData.module_id) {
      enqueueSnackbar('Please select a module for this lesson', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      // In production, upload the document file first, then create lesson with the URL
      const payload = {
        module_id: lessonData.module_id,
        title: lessonData.title,
        description: lessonData.description,
        content_type: lessonData.content_type,
        content_url: lessonData.content_url || null,
        is_published: false,
      };
      const res = await lessonsAPI.create(payload);
      if (res?.data?.success) {
        enqueueSnackbar('Lesson created successfully!', { variant: 'success' });
        setLessonDialogOpen(false);
        setLessonData({ title: '', description: '', content_type: 'pdf', document_file: null, content_url: '', module_id: '' });
        fetchAllContent();
      } else {
        enqueueSnackbar('Failed to create lesson', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error creating lesson', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={56} />
      </Box>
    );
  }

  if (!course) {
    return (
      <Box>
        <PageHeader title="Course Not Found" subtitle="We couldn't find this course" />
        <Card sx={{ mt: 3, p: 4, textAlign: 'center' }}>
          <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            This course doesn't exist or has been removed
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The course may have been deleted, or you might not have permission to view it.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button variant="contained" onClick={() => navigate('/courses')}>
              Browse Courses
            </Button>
          </Box>
        </Card>
      </Box>
    );
  }

  // Only admins can edit course information, but instructors can manage content
  const canEdit = isAdmin;
  const isInstructorOfCourse = isInstructor && user && course?.instructor_id && user.user_id === course.instructor_id;

  const priceValue = parseFloat(course.price || 0) || 0;
  const isFree = priceValue === 0;
  const status = course.status || 'published';

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader
        title={course.title || 'Course Detail'}
        subtitle={course.category || 'Course overview'}
        actionText={canEdit ? 'Edit Course Info' : undefined}
        actionLink={canEdit ? `/courses/${course.course_id}/edit` : undefined}
        actions={
          isInstructorOfCourse && (
            <Button
              variant={course.status === 'published' ? 'outlined' : 'contained'}
              startIcon={course.status === 'published' ? <Unpublished /> : <Publish />}
              onClick={handleTogglePublish}
              disabled={publishing}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                ...(course.status !== 'published' && {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }),
              }}
            >
              {publishing ? 'Updating...' : course.status === 'published' ? 'Unpublish' : 'Publish Course'}
            </Button>
          )
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height="320"
                image={
                  course.thumbnail_url ||
                  'https://via.placeholder.com/800x320?text=Course+Thumbnail'
                }
                alt={course.title}
                sx={{ objectFit: 'cover' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.1) 60%, transparent 100%)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  right: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <Box>
                  <Chip
                    label={course.category || 'General'}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.3),
                      color: '#fff',
                      fontWeight: 600,
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: '#fff',
                      textShadow: '0 4px 12px rgba(0,0,0,0.6)',
                    }}
                  >
                    {course.title}
                  </Typography>
                </Box>
                <Chip
                  label={
                    status === 'published'
                      ? 'Published'
                      : status === 'draft'
                      ? 'Draft'
                      : 'Archived'
                  }
                  size="small"
                  color={
                    status === 'published'
                      ? 'success'
                      : status === 'draft'
                      ? 'warning'
                      : 'default'
                  }
                />
              </Box>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                About this course
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {course.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={2.5}>
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Course Overview
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                    {isFree ? 'Free' : `$${priceValue.toFixed(2)}`}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTime sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {course.duration || 0} hours
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <People sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Max Students
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {course.max_students || 'Unlimited'}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Star sx={{ fontSize: 22, color: theme.palette.warning.main }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    4.5
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Average rating (placeholder)
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ width: 40, height: 40 }}>
                    {course.instructor_name?.charAt(0)?.toUpperCase() || 'I'}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Instructor
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {course.instructor_name || 'Unknown Instructor'}
                    </Typography>
                  </Box>
                </Stack>

                {/* Enrollment Button for Students */}
                {!isAdmin && !isInstructorOfCourse && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    {checkingEnrollment ? (
                      <Button variant="outlined" fullWidth disabled>
                        Checking enrollment...
                      </Button>
                    ) : isEnrolled ? (
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        disabled
                        startIcon={<CheckCircleRounded />}
                        sx={{ 
                          fontWeight: 700,
                          borderColor: 'success.main',
                          color: 'success.main',
                        }}
                      >
                        Already Enrolled
                      </Button>
                    ) : (
                      <Button 
                        variant="contained" 
                        fullWidth
                        onClick={handleEnroll}
                        disabled={enrolling}
                        sx={{ 
                          fontWeight: 700,
                          textTransform: 'none',
                          py: 1.5,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                          },
                        }}
                      >
                        {enrolling ? 'Enrolling...' : 'Enroll in this Course'}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {canEdit && (
              <Card
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  bgcolor: alpha(theme.palette.primary.light, 0.08),
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Admin Actions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    As an admin, you can edit this course's details, pricing, and publish status.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/courses/${course.course_id}/edit`)}
                    startIcon={<School />}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Edit Course Info
                  </Button>
                </CardContent>
              </Card>
            )}

            {isInstructorOfCourse && (
              <>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'success.main',
                    bgcolor: alpha(theme.palette.success.light, 0.08),
                    mb: 3,
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Quick Create
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Add content to this course
                    </Typography>
                    <Stack spacing={1.5}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VideoLibrary />}
                        onClick={() => setModuleDialogOpen(true)}
                        sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                      >
                        Add Module
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Description />}
                        onClick={() => setLessonDialogOpen(true)}
                        sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                      >
                        Add Lesson
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Assignment />}
                        onClick={() => setAssignmentDialogOpen(true)}
                        sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                      >
                        Create Assignment
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Quiz />}
                        onClick={() => setQuizDialogOpen(true)}
                        sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                      >
                        Create Quiz
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Forum />}
                        onClick={() => setForumDialogOpen(true)}
                        sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                      >
                        Create Forum
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Course Content
                    </Typography>
                    
                    <List sx={{ p: 0 }}>
                      <ListItem
                        button
                        onClick={() => setContentView(contentView === 'modules' ? 'overview' : 'modules')}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: contentView === 'modules' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        }}
                      >
                        <ListItemIcon><VideoLibrary color={contentView === 'modules' ? 'primary' : 'inherit'} /></ListItemIcon>
                        <ListItemText
                          primary="Modules"
                          secondary={`${modules.length} created`}
                        />
                        <Chip label={modules.length} size="small" color={contentView === 'modules' ? 'primary' : 'default'} />
                      </ListItem>
                      
                      <ListItem
                        button
                        onClick={() => setContentView(contentView === 'lessons' ? 'overview' : 'lessons')}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: contentView === 'lessons' ? alpha(theme.palette.info.main, 0.1) : 'transparent',
                        }}
                      >
                        <ListItemIcon><Description color={contentView === 'lessons' ? 'info' : 'inherit'} /></ListItemIcon>
                        <ListItemText
                          primary="Lessons"
                          secondary={`${lessons.length} created`}
                        />
                        <Chip label={lessons.length} size="small" color={contentView === 'lessons' ? 'info' : 'default'} />
                      </ListItem>
                      
                      <ListItem
                        button
                        onClick={() => setContentView(contentView === 'assignments' ? 'overview' : 'assignments')}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: contentView === 'assignments' ? alpha(theme.palette.secondary.main, 0.1) : 'transparent',
                        }}
                      >
                        <ListItemIcon><Assignment color={contentView === 'assignments' ? 'secondary' : 'inherit'} /></ListItemIcon>
                        <ListItemText
                          primary="Assignments"
                          secondary={`${assignments.length} created`}
                        />
                        <Chip label={assignments.length} size="small" color={contentView === 'assignments' ? 'secondary' : 'default'} />
                      </ListItem>
                      
                      <ListItem
                        button
                        onClick={() => setContentView(contentView === 'quizzes' ? 'overview' : 'quizzes')}
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: contentView === 'quizzes' ? alpha(theme.palette.error.main, 0.1) : 'transparent',
                        }}
                      >
                        <ListItemIcon><Quiz color={contentView === 'quizzes' ? 'error' : 'inherit'} /></ListItemIcon>
                        <ListItemText
                          primary="Quizzes"
                          secondary={`${quizzes.length} created`}
                        />
                        <Chip label={quizzes.length} size="small" color={contentView === 'quizzes' ? 'error' : 'default'} />
                      </ListItem>
                      
                      <ListItem
                        button
                        onClick={() => setContentView(contentView === 'forums' ? 'overview' : 'forums')}
                        sx={{
                          borderRadius: 2,
                          bgcolor: contentView === 'forums' ? alpha(theme.palette.success.main, 0.1) : 'transparent',
                        }}
                      >
                        <ListItemIcon><Forum color={contentView === 'forums' ? 'success' : 'inherit'} /></ListItemIcon>
                        <ListItemText
                          primary="Forums"
                          secondary={`${forums.length} created`}
                        />
                        <Chip label={forums.length} size="small" color={contentView === 'forums' ? 'success' : 'default'} />
                      </ListItem>
                    </List>

                    {contentView !== 'overview' && (
                      <Box sx={{ mt: 3 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                          {contentView === 'modules' && 'Modules List'}
                          {contentView === 'lessons' && 'Lessons List'}
                          {contentView === 'assignments' && 'Assignments List'}
                          {contentView === 'quizzes' && 'Quizzes List'}
                          {contentView === 'forums' && 'Forums List'}
                        </Typography>
                        
                        {contentView === 'modules' && modules.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No modules yet. Click "Add Module" to create one.
                          </Typography>
                        )}
                        {contentView === 'modules' && modules.map((module) => (
                          <Paper key={module.module_id} sx={{ p: 2, mb: 1, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{module.title}</Typography>
                            <Typography variant="caption" color="text.secondary">{module.description || 'No description'}</Typography>
                          </Paper>
                        ))}
                        
                        {contentView === 'lessons' && lessons.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No lessons yet. Click "Add Lesson" to create one.
                          </Typography>
                        )}
                        {contentView === 'lessons' && lessons.map((lesson) => (
                          <Paper key={lesson.lesson_id} sx={{ p: 2, mb: 1, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{lesson.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {lesson.content_type} • {lesson.description || 'No description'}
                            </Typography>
                          </Paper>
                        ))}
                        
                        {contentView === 'assignments' && assignments.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No assignments yet. Click "Create Assignment" to add one.
                          </Typography>
                        )}
                        {contentView === 'assignments' && assignments.map((assignment) => (
                          <Paper key={assignment.assignment_id} sx={{ p: 2, mb: 1, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{assignment.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Max Score: {assignment.max_score} • Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No deadline'}
                            </Typography>
                          </Paper>
                        ))}
                        
                        {contentView === 'quizzes' && quizzes.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No quizzes yet. Click "Create Quiz" to add one.
                          </Typography>
                        )}
                        {contentView === 'quizzes' && quizzes.map((quiz) => (
                          <Paper key={quiz.quiz_id} sx={{ p: 2, mb: 1, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{quiz.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {quiz.duration_minutes} min • {quiz.passing_score}% to pass
                            </Typography>
                          </Paper>
                        ))}
                        
                        {contentView === 'forums' && forums.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            No forums yet. Click "Create Forum" to add one.
                          </Typography>
                        )}
                        {contentView === 'forums' && forums.map((forum) => (
                          <Paper key={forum.forum_id} sx={{ p: 2, mb: 1, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{forum.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {forum.category || 'General'} • {forum.description || 'No description'}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Create Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Create Assignment
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Assignment Title"
            value={assignmentData.title}
            onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={assignmentData.description}
            onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="Brief description of the assignment"
          />
          <TextField
            fullWidth
            label="Detailed Instructions"
            value={assignmentData.instructions}
            onChange={(e) => setAssignmentData({ ...assignmentData, instructions: e.target.value })}
            multiline
            rows={4}
            sx={{ mb: 2 }}
            placeholder="Provide detailed instructions for students..."
          />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                value={assignmentData.due_date}
                onChange={(e) => setAssignmentData({ ...assignmentData, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Score"
                type="number"
                value={assignmentData.max_score}
                onChange={(e) => setAssignmentData({ ...assignmentData, max_score: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Attach Reference Files (Optional)
          </Typography>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: assignmentData.attachment_file ? 'success.main' : 'divider',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Description sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="body2" sx={{ mb: 2 }}>
              {assignmentData.attachment_file ? assignmentData.attachment_file.name : 'Upload assignment files, templates, or resources'}
            </Typography>
            <Button variant="contained" component="label" sx={{ textTransform: 'none' }}>
              Choose File
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.zip"
                onChange={(e) => setAssignmentData({ ...assignmentData, attachment_file: e.target.files[0] })}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              PDF, DOC, DOCX, ZIP (Max 25MB)
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAssignmentDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateAssignment}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Creating...' : 'Create Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Quiz Dialog */}
      <Dialog open={quizDialogOpen} onClose={() => setQuizDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Quiz />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Create Quiz
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Quiz Title"
            value={quizData.title}
            onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={quizData.description}
            onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="Describe what this quiz covers..."
          />
          
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Quiz Settings
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={quizData.duration_minutes}
                onChange={(e) => setQuizData({ ...quizData, duration_minutes: parseInt(e.target.value) })}
                helperText="Time limit"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Passing Score (%)"
                type="number"
                value={quizData.passing_score}
                onChange={(e) => setQuizData({ ...quizData, passing_score: parseInt(e.target.value) })}
                helperText="Minimum to pass"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Max Attempts"
                type="number"
                value={quizData.max_attempts}
                onChange={(e) => setQuizData({ ...quizData, max_attempts: parseInt(e.target.value) })}
                helperText="Retry limit"
              />
            </Grid>
          </Grid>
          
          <Paper sx={{ p: 2, bgcolor: alpha('#f093fb', 0.1), mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Shuffle Questions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Randomize question order for each attempt
                </Typography>
              </Box>
              <Button
                variant={quizData.shuffle_questions ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setQuizData({ ...quizData, shuffle_questions: !quizData.shuffle_questions })}
                sx={{ textTransform: 'none' }}
              >
                {quizData.shuffle_questions ? 'Enabled' : 'Disabled'}
              </Button>
            </Box>
          </Paper>
          
          <Divider sx={{ my: 2 }} />
          
          <Paper sx={{ p: 2, bgcolor: alpha('#4facfe', 0.1) }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Quiz fontSize="small" />
              After creating the quiz, you'll be able to add questions from the quiz management page.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuizDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateQuiz}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Creating...' : 'Create Quiz'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Forum Dialog */}
      <Dialog open={forumDialogOpen} onClose={() => setForumDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Forum />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Create Discussion Forum
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Forum Title"
            value={forumData.title}
            onChange={(e) => setForumData({ ...forumData, title: e.target.value })}
            sx={{ mb: 2 }}
            required
            placeholder="e.g., Week 1 Discussion, General Q&A"
          />
          <TextField
            fullWidth
            label="Description"
            value={forumData.description}
            onChange={(e) => setForumData({ ...forumData, description: e.target.value })}
            multiline
            rows={4}
            sx={{ mb: 2 }}
            placeholder="Describe the purpose of this forum and what students should discuss..."
          />
          
          <TextField
            fullWidth
            select
            label="Forum Category"
            value={forumData.category}
            onChange={(e) => setForumData({ ...forumData, category: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="general">General Discussion</MenuItem>
            <MenuItem value="qa">Q&A / Help</MenuItem>
            <MenuItem value="announcements">Announcements</MenuItem>
            <MenuItem value="assignments">Assignment Discussion</MenuItem>
            <MenuItem value="projects">Project Collaboration</MenuItem>
            <MenuItem value="resources">Resource Sharing</MenuItem>
          </TextField>
          
          <Divider sx={{ my: 2 }} />
          
          <Paper sx={{ p: 2, bgcolor: alpha('#4facfe', 0.1) }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Forum Guidelines
            </Typography>
            <Typography variant="caption" color="text.secondary" component="div">
              • Students can create threads and reply to discussions<br />
              • You can moderate and pin important threads<br />
              • Forums encourage peer-to-peer learning
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setForumDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateForum}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Creating...' : 'Create Forum'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Module Dialog */}
      <Dialog open={moduleDialogOpen} onClose={() => setModuleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideoLibrary />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Create Module
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Module Title"
            value={moduleData.title}
            onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={moduleData.description}
            onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 3 }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
            Add Introductory Video (Optional)
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant={videoUploadMethod === 'url' ? 'contained' : 'outlined'}
                  onClick={() => setVideoUploadMethod('url')}
                  sx={{ textTransform: 'none' }}
                >
                  Video URL
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant={videoUploadMethod === 'upload' ? 'contained' : 'outlined'}
                  onClick={() => setVideoUploadMethod('upload')}
                  sx={{ textTransform: 'none' }}
                >
                  Upload Video
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {videoUploadMethod === 'url' ? (
            <TextField
              fullWidth
              label="Video URL (YouTube, Vimeo, etc.)"
              value={moduleData.video_url}
              onChange={(e) => setModuleData({ ...moduleData, video_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              helperText="Paste a YouTube, Vimeo, or direct video URL"
            />
          ) : (
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: moduleData.video_file ? 'success.main' : 'divider',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              }}
            >
              <VideoLibrary sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="body2" sx={{ mb: 2 }}>
                {moduleData.video_file ? moduleData.video_file.name : 'Select a video file to upload'}
              </Typography>
              <Button variant="contained" component="label" sx={{ textTransform: 'none' }}>
                Choose Video File
                <input
                  type="file"
                  hidden
                  accept="video/*"
                  onChange={(e) => setModuleData({ ...moduleData, video_file: e.target.files[0] })}
                />
              </Button>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Supported formats: MP4, AVI, MOV (Max 500MB)
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModuleDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateModule}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Creating...' : 'Create Module'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onClose={() => setLessonDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Add Lesson
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {modules.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha('#ff9800', 0.1) }}>
              <Typography variant="body2" color="text.secondary">
                Please create a module first before adding lessons.
              </Typography>
              <Button
                variant="contained"
                onClick={() => { setLessonDialogOpen(false); setModuleDialogOpen(true); }}
                sx={{ mt: 2, textTransform: 'none' }}
              >
                Create Module
              </Button>
            </Paper>
          ) : (
            <>
              <TextField
                fullWidth
                select
                label="Select Module"
                value={lessonData.module_id}
                onChange={(e) => setLessonData({ ...lessonData, module_id: e.target.value })}
                sx={{ mb: 2 }}
                required
              >
                {modules.map((module) => (
                  <MenuItem key={module.module_id} value={module.module_id}>
                    {module.title}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                label="Lesson Title"
                value={lessonData.title}
                onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                label="Description"
                value={lessonData.description}
                onChange={(e) => setLessonData({ ...lessonData, description: e.target.value })}
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                select
                label="Content Type"
                value={lessonData.content_type}
                onChange={(e) => setLessonData({ ...lessonData, content_type: e.target.value })}
                sx={{ mb: 2 }}
              >
                <MenuItem value="pdf">PDF Document</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="text">Text Content</MenuItem>
              </TextField>
              
              {lessonData.content_type === 'pdf' && (
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: lessonData.document_file ? 'success.main' : 'divider',
                    bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
                  }}
                >
                  <Description sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {lessonData.document_file ? lessonData.document_file.name : 'Upload lesson document (PDF, DOCX, etc.)'}
                  </Typography>
                  <Button variant="contained" component="label" sx={{ textTransform: 'none' }}>
                    Choose Document
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={(e) => setLessonData({ ...lessonData, document_file: e.target.files[0] })}
                    />
                  </Button>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Supported: PDF, DOC, DOCX, PPT, PPTX (Max 50MB)
                  </Typography>
                </Paper>
              )}
              
              {lessonData.content_type === 'video' && (
                <TextField
                  fullWidth
                  label="Video URL"
                  value={lessonData.content_url}
                  onChange={(e) => setLessonData({ ...lessonData, content_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  helperText="Paste a YouTube, Vimeo, or direct video URL"
                />
              )}
              
              {lessonData.content_type === 'text' && (
                <TextField
                  fullWidth
                  label="Text Content"
                  value={lessonData.content_url}
                  onChange={(e) => setLessonData({ ...lessonData, content_url: e.target.value })}
                  multiline
                  rows={6}
                  placeholder="Enter the lesson content here..."
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLessonDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          {modules.length > 0 && (
            <Button
              variant="contained"
              onClick={handleCreateLesson}
              disabled={submitting}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {submitting ? 'Creating...' : 'Add Lesson'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseDetail;
