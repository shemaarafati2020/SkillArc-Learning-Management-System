import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Paper,
  alpha,
} from '@mui/material';
import {
  School,
  Assignment,
  Quiz,
  Forum,
  MoreVert,
  Add,
  People,
  Edit,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import { coursesAPI, assignmentsAPI, quizzesAPI, forumsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const MyCourses = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, isInstructor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Dialog states
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [forumDialogOpen, setForumDialogOpen] = useState(false);
  
  // Form states
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    due_date: '',
    max_score: 100,
  });
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    duration_minutes: 30,
    passing_score: 60,
    max_attempts: 3,
  });
  const [forumData, setForumData] = useState({
    title: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await coursesAPI.getMyCourses();
      if (res?.data?.success) {
        setCourses(res.data.data || []);
      } else {
        enqueueSnackbar('Failed to load courses', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      enqueueSnackbar('Error loading courses', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, course) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenAssignmentDialog = () => {
    setAssignmentDialogOpen(true);
    handleMenuClose();
  };

  const handleOpenQuizDialog = () => {
    setQuizDialogOpen(true);
    handleMenuClose();
  };

  const handleOpenForumDialog = () => {
    setForumDialogOpen(true);
    handleMenuClose();
  };

  const handleCreateAssignment = async () => {
    if (!assignmentData.title.trim()) {
      enqueueSnackbar('Assignment title is required', { variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        course_id: selectedCourse.course_id,
        title: assignmentData.title,
        description: assignmentData.description,
        due_date: assignmentData.due_date || null,
        max_score: assignmentData.max_score,
        is_published: false,
      };

      const res = await assignmentsAPI.create(payload);
      if (res?.data?.success) {
        enqueueSnackbar('Assignment created successfully!', { variant: 'success' });
        setAssignmentDialogOpen(false);
        setAssignmentData({ title: '', description: '', due_date: '', max_score: 100 });
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to create assignment', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
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
      const payload = {
        course_id: selectedCourse.course_id,
        title: quizData.title,
        description: quizData.description,
        duration_minutes: quizData.duration_minutes,
        passing_score: quizData.passing_score,
        max_attempts: quizData.max_attempts,
        is_published: false,
      };

      const res = await quizzesAPI.create(payload);
      if (res?.data?.success) {
        enqueueSnackbar('Quiz created successfully!', { variant: 'success' });
        setQuizDialogOpen(false);
        setQuizData({ title: '', description: '', duration_minutes: 30, passing_score: 60, max_attempts: 3 });
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to create quiz', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
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
      const payload = {
        course_id: selectedCourse.course_id,
        title: forumData.title,
        description: forumData.description,
      };

      const res = await forumsAPI.createForum(payload);
      if (res?.data?.success) {
        enqueueSnackbar('Forum created successfully!', { variant: 'success' });
        setForumDialogOpen(false);
        setForumData({ title: '', description: '' });
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to create forum', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error creating forum:', error);
      enqueueSnackbar('Error creating forum', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title="My Courses"
        subtitle={isInstructor ? "Manage content for your assigned courses" : "View your enrolled courses"}
      />

      {courses.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              {isInstructor ? "You haven't been assigned any courses yet" : "You haven't enrolled in any courses yet"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isInstructor ? "An admin needs to assign courses to you. Once assigned, you can add lessons, assignments, quizzes, and forums." : "Browse available courses and enroll"}
            </Typography>
            {!isInstructor && (
              <Button
                variant="contained"
                onClick={() => navigate('/courses')}
                sx={{ mt: 3, textTransform: 'none' }}
              >
                Browse Courses
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.course_id}>
              <Card
                component={motion.div}
                whileHover={{ y: -4 }}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 6,
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Box
                  sx={{
                    height: 160,
                    background: course.thumbnail_url
                      ? `url(${course.thumbnail_url})`
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <Chip
                      label={course.status || 'draft'}
                      size="small"
                      color={course.status === 'published' ? 'success' : 'warning'}
                      sx={{ fontWeight: 600 }}
                    />
                    {isInstructor && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, course)}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.9)',
                          '&:hover': { bgcolor: 'white' },
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {course.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {course.description || 'No description available'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {course.category && (
                      <Chip label={course.category} size="small" variant="outlined" />
                    )}
                    <Chip
                      icon={<People />}
                      label={`${course.enrolled_count || 0} students`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/courses/${course.course_id}`)}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    View Course
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Course Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleOpenAssignmentDialog}>
          <ListItemIcon><Assignment fontSize="small" /></ListItemIcon>
          <ListItemText>Create Assignment</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenQuizDialog}>
          <ListItemIcon><Quiz fontSize="small" /></ListItemIcon>
          <ListItemText>Create Quiz</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenForumDialog}>
          <ListItemIcon><Forum fontSize="small" /></ListItemIcon>
          <ListItemText>Create Forum</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Create Assignment for {selectedCourse?.title}
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
            rows={4}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Due Date"
            type="datetime-local"
            value={assignmentData.due_date}
            onChange={(e) => setAssignmentData({ ...assignmentData, due_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Max Score"
            type="number"
            value={assignmentData.max_score}
            onChange={(e) => setAssignmentData({ ...assignmentData, max_score: parseInt(e.target.value) })}
          />
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
      <Dialog open={quizDialogOpen} onClose={() => setQuizDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Quiz />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Create Quiz for {selectedCourse?.title}
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
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Duration (min)"
                type="number"
                value={quizData.duration_minutes}
                onChange={(e) => setQuizData({ ...quizData, duration_minutes: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Passing Score (%)"
                type="number"
                value={quizData.passing_score}
                onChange={(e) => setQuizData({ ...quizData, passing_score: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Max Attempts"
                type="number"
                value={quizData.max_attempts}
                onChange={(e) => setQuizData({ ...quizData, max_attempts: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
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
      <Dialog open={forumDialogOpen} onClose={() => setForumDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Forum />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Create Forum for {selectedCourse?.title}
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
          />
          <TextField
            fullWidth
            label="Description"
            value={forumData.description}
            onChange={(e) => setForumData({ ...forumData, description: e.target.value })}
            multiline
            rows={4}
          />
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
    </Box>
  );
};

export default MyCourses;
