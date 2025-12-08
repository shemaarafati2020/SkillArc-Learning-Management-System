import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Chip,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  alpha,
  Divider,
} from '@mui/material';
import {
  Add,
  Quiz,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  Timer,
  EmojiEvents,
  Repeat,
  School,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { quizzesAPI, coursesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const QuizList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isInstructor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    duration_minutes: 30,
    passing_score: 60,
    max_attempts: 3,
    shuffle_questions: true,
  });

  useEffect(() => {
    fetchQuizzes();
    if (isInstructor) {
      fetchCourses();
    }
  }, [isInstructor]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await quizzesAPI.getAll();
      if (res?.data?.success) {
        setQuizzes(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      enqueueSnackbar('Error loading quizzes', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await coursesAPI.getMyCourses();
      if (res?.data?.success) {
        setCourses(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleOpenDialog = (quiz = null) => {
    if (quiz) {
      setEditMode(true);
      setSelectedQuiz(quiz);
      setFormData({
        course_id: quiz.course_id,
        title: quiz.title,
        description: quiz.description || '',
        duration_minutes: quiz.duration_minutes || 30,
        passing_score: quiz.passing_score || 60,
        max_attempts: quiz.max_attempts || 3,
        shuffle_questions: quiz.shuffle_questions !== undefined ? quiz.shuffle_questions : true,
      });
    } else {
      setEditMode(false);
      setSelectedQuiz(null);
      setFormData({
        course_id: '',
        title: '',
        description: '',
        duration_minutes: 30,
        passing_score: 60,
        max_attempts: 3,
        shuffle_questions: true,
      });
    }
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedQuiz(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      enqueueSnackbar('Quiz title is required', { variant: 'warning' });
      return;
    }
    if (!formData.course_id) {
      enqueueSnackbar('Please select a course', { variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        course_id: formData.course_id,
        title: formData.title,
        description: formData.description,
        duration_minutes: formData.duration_minutes,
        passing_score: formData.passing_score,
        max_attempts: formData.max_attempts,
        shuffle_questions: formData.shuffle_questions ? 1 : 0,
        is_published: false,
      };

      const res = editMode
        ? await quizzesAPI.update(selectedQuiz.quiz_id, payload)
        : await quizzesAPI.create(payload);

      if (res?.data?.success) {
        enqueueSnackbar(`Quiz ${editMode ? 'updated' : 'created'} successfully!`, { variant: 'success' });
        handleCloseDialog();
        fetchQuizzes();
      } else {
        enqueueSnackbar(`Failed to ${editMode ? 'update' : 'create'} quiz`, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(`Error ${editMode ? 'updating' : 'creating'} quiz`, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await quizzesAPI.delete(selectedQuiz.quiz_id);
      if (res?.data?.success) {
        enqueueSnackbar('Quiz deleted successfully!', { variant: 'success' });
        setDeleteDialogOpen(false);
        setSelectedQuiz(null);
        fetchQuizzes();
      } else {
        enqueueSnackbar('Failed to delete quiz', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error deleting quiz', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event, quiz) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuiz(quiz);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    setViewDialogOpen(true);
    handleMenuClose();
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
        title="Quizzes"
        subtitle={isInstructor ? "Manage course quizzes" : "Take quizzes and test your knowledge"}
        actions={
          isInstructor && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                },
              }}
            >
              Create Quiz
            </Button>
          )
        }
      />

      {quizzes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Quiz sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No quizzes available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {isInstructor ? 'Create your first quiz' : 'Quizzes will appear here when available'}
            </Typography>
            {isInstructor && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{ textTransform: 'none' }}
              >
                Create Quiz
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          {courses.map((course) => {
            const courseQuizzes = quizzes.filter(q => q.course_id === course.course_id);
            if (courseQuizzes.length === 0) return null;
            
            return (
              <Box key={course.course_id} sx={{ mb: 4 }}>
                <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School />
                    {course.title}
                    <Chip 
                      label={`${courseQuizzes.length} quiz${courseQuizzes.length !== 1 ? 'zes' : ''}`}
                      size="small"
                      sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
                    />
                  </Typography>
                </Paper>
                <Grid container spacing={3}>
                  {courseQuizzes.map((quiz) => (
            <Grid item xs={12} sm={6} md={4} key={quiz.quiz_id}>
              <Card
                component={motion.div}
                whileHover={{ y: -4 }}
                sx={{
                  height: '100%',
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
                    height: 140,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Quiz sx={{ fontSize: 64, color: 'white', opacity: 0.9 }} />
                  {isInstructor && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, quiz)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        '&:hover': { bgcolor: 'white' },
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  )}
                  <Chip
                    label={`${quiz.question_count || 0} Questions`}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      fontWeight: 700,
                    }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {quiz.title}
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
                    {quiz.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                      icon={<Timer />}
                      label={`${quiz.duration_minutes} min`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<EmojiEvents />}
                      label={`${quiz.passing_score}% to pass`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<Repeat />}
                      label={`${quiz.max_attempts} attempts`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {quiz.course_title || 'Course'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
                  ))}
                </Grid>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleView}>
          <ListItemIcon><Visibility fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleOpenDialog(selectedQuiz)}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Quiz</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete Quiz</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Quiz />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editMode ? 'Edit Quiz' : 'Create New Quiz'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            select
            label="Select Course"
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            sx={{ mb: 2 }}
            required
          >
            {courses.map((course) => (
              <MenuItem key={course.course_id} value={course.course_id}>
                {course.title}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            fullWidth
            label="Quiz Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                helperText="Time limit"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Passing Score (%)"
                type="number"
                value={formData.passing_score}
                onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                helperText="Minimum to pass"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Max Attempts"
                type="number"
                value={formData.max_attempts}
                onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
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
                variant={formData.shuffle_questions ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setFormData({ ...formData, shuffle_questions: !formData.shuffle_questions })}
                sx={{ textTransform: 'none' }}
              >
                {formData.shuffle_questions ? 'Enabled' : 'Disabled'}
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
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Saving...' : editMode ? 'Update Quiz' : 'Create Quiz'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Quiz Details</DialogTitle>
        <DialogContent>
          {selectedQuiz && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {selectedQuiz.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedQuiz.description || 'No description'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2"><strong>Course:</strong> {selectedQuiz.course_title}</Typography>
              <Typography variant="body2"><strong>Duration:</strong> {selectedQuiz.duration_minutes} minutes</Typography>
              <Typography variant="body2"><strong>Passing Score:</strong> {selectedQuiz.passing_score}%</Typography>
              <Typography variant="body2"><strong>Max Attempts:</strong> {selectedQuiz.max_attempts}</Typography>
              <Typography variant="body2"><strong>Questions:</strong> {selectedQuiz.question_count || 0}</Typography>
              <Typography variant="body2"><strong>Shuffle:</strong> {selectedQuiz.shuffle_questions ? 'Yes' : 'No'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Quiz?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedQuiz?.title}"? This action cannot be undone and will delete all associated questions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={submitting}
            sx={{ textTransform: 'none' }}
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizList;
