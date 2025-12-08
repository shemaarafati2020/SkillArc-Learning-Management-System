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
  Description,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  VideoLibrary,
  PictureAsPdf,
  TextFields,
  Notifications,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { lessonsAPI, modulesAPI, coursesAPI, notificationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const LessonList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isInstructor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
  });
  
  const [formData, setFormData] = useState({
    module_id: '',
    title: '',
    description: '',
    content_type: 'pdf',
    content_url: '',
    document_file: null,
    video_file: null,
    duration_minutes: 0,
    order_index: 1,
  });

  useEffect(() => {
    fetchLessons();
    fetchCourses();
  }, []);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const res = await lessonsAPI.getAll();
      if (res?.data?.success) {
        setLessons(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      enqueueSnackbar('Error loading lessons', { variant: 'error' });
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

  const fetchModulesByCourse = async (courseId) => {
    try {
      const res = await modulesAPI.getByCourse(courseId);
      if (res?.data?.success) {
        setModules(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleOpenDialog = (lesson = null) => {
    if (lesson) {
      setEditMode(true);
      setSelectedLesson(lesson);
      setFormData({
        module_id: lesson.module_id,
        title: lesson.title,
        description: lesson.description || '',
        content_type: lesson.content_type || 'pdf',
        content_url: lesson.content_url || '',
        document_file: null,
        video_file: null,
        duration_minutes: lesson.duration_minutes || 0,
        order_index: lesson.order_index || 1,
      });
      if (lesson.course_id) {
        fetchModulesByCourse(lesson.course_id);
      }
    } else {
      setEditMode(false);
      setSelectedLesson(null);
      setFormData({
        module_id: '',
        title: '',
        description: '',
        content_type: 'pdf',
        content_url: '',
        document_file: null,
        video_file: null,
        duration_minutes: 0,
        order_index: 1,
      });
    }
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedLesson(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      enqueueSnackbar('Lesson title is required', { variant: 'warning' });
      return;
    }
    if (!formData.module_id) {
      enqueueSnackbar('Please select a module', { variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        module_id: formData.module_id,
        title: formData.title,
        description: formData.description,
        content_type: formData.content_type,
        content_url: formData.content_url || null,
        duration_minutes: formData.duration_minutes,
        order_index: formData.order_index,
        is_published: false,
      };

      const res = editMode
        ? await lessonsAPI.update(selectedLesson.lesson_id, payload)
        : await lessonsAPI.create(payload);

      if (res?.data?.success) {
        enqueueSnackbar(`Lesson ${editMode ? 'updated' : 'created'} successfully!`, { variant: 'success' });
        handleCloseDialog();
        fetchLessons();
      } else {
        enqueueSnackbar(`Failed to ${editMode ? 'update' : 'create'} lesson`, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(`Error ${editMode ? 'updating' : 'creating'} lesson`, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await lessonsAPI.delete(selectedLesson.lesson_id);
      if (res?.data?.success) {
        enqueueSnackbar('Lesson deleted successfully!', { variant: 'success' });
        setDeleteDialogOpen(false);
        setSelectedLesson(null);
        fetchLessons();
      } else {
        enqueueSnackbar('Failed to delete lesson', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error deleting lesson', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event, lesson) => {
    setAnchorEl(event.currentTarget);
    setSelectedLesson(lesson);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleOpenNotification = () => {
    setNotificationData({
      title: `New Lesson Available: ${selectedLesson.title}`,
      message: `A new lesson "${selectedLesson.title}" has been added to ${selectedLesson.module_title}. Check it out now!`,
    });
    setNotificationDialogOpen(true);
    handleMenuClose();
  };

  const handleSendNotification = async () => {
    if (!notificationData.title.trim() || !notificationData.message.trim()) {
      enqueueSnackbar('Title and message are required', { variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: notificationData.title,
        message: notificationData.message,
        type: 'lesson',
        related_id: selectedLesson.lesson_id,
        course_id: selectedLesson.course_id,
      };

      const res = await notificationsAPI.send(payload);
      if (res?.data?.success) {
        enqueueSnackbar('Notification sent to all enrolled students!', { variant: 'success' });
        setNotificationDialogOpen(false);
        setNotificationData({ title: '', message: '' });
      } else {
        enqueueSnackbar('Failed to send notification', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error sending notification', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoLibrary />;
      case 'pdf':
        return <PictureAsPdf />;
      case 'text':
        return <TextFields />;
      default:
        return <Description />;
    }
  };

  const getContentColor = (type) => {
    switch (type) {
      case 'video':
        return '#f093fb';
      case 'pdf':
        return '#4facfe';
      case 'text':
        return '#43e97b';
      default:
        return '#667eea';
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
        title="Lessons"
        subtitle="Manage your course lessons"
        actions={
          isInstructor && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                },
              }}
            >
              Create Lesson
            </Button>
          )
        }
      />

      {lessons.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No lessons created yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first lesson to add content to your modules
            </Typography>
            {isInstructor && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{ textTransform: 'none' }}
              >
                Create Lesson
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          {courses.map((course) => {
            const courseLessons = lessons.filter(l => l.course_id === course.course_id);
            if (courseLessons.length === 0) return null;
            
            return (
              <Box key={course.course_id} sx={{ mb: 4 }}>
                <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Description />
                    {course.title}
                    <Chip 
                      label={`${courseLessons.length} lesson${courseLessons.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
                    />
                  </Typography>
                </Paper>
                <Grid container spacing={3}>
                  {courseLessons.map((lesson) => (
            <Grid item xs={12} sm={6} md={4} key={lesson.lesson_id}>
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
                    borderColor: getContentColor(lesson.content_type),
                  },
                }}
              >
                <Box
                  sx={{
                    height: 140,
                    background: `linear-gradient(135deg, ${getContentColor(lesson.content_type)} 0%, ${alpha(getContentColor(lesson.content_type), 0.7)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {getContentIcon(lesson.content_type)}
                  {isInstructor && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, lesson)}
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
                    label={lesson.content_type.toUpperCase()}
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      fontWeight: 700,
                    }}
                  />
                </Box>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {lesson.title}
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
                    {lesson.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={lesson.module_title || 'Module'}
                      size="small"
                      variant="outlined"
                    />
                    {lesson.duration_minutes > 0 && (
                      <Chip
                        label={`${lesson.duration_minutes} min`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>
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
        <MenuItem onClick={() => handleOpenDialog(selectedLesson)}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Lesson</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleOpenNotification}>
          <ListItemIcon><Notifications fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText>Send Notification</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete Lesson</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editMode ? 'Edit Lesson' : 'Create New Lesson'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            select
            label="Select Course"
            onChange={(e) => {
              fetchModulesByCourse(e.target.value);
              setFormData({ ...formData, module_id: '' });
            }}
            sx={{ mb: 2 }}
          >
            {courses.map((course) => (
              <MenuItem key={course.course_id} value={course.course_id}>
                {course.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            select
            label="Select Module"
            value={formData.module_id}
            onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
            sx={{ mb: 2 }}
            required
            disabled={modules.length === 0}
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
          />

          <TextField
            fullWidth
            label="Duration (minutes)"
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
            sx={{ mb: 3 }}
          />
          
          <Divider sx={{ my: 3 }} />
          
          {/* Video Content Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideoLibrary color="primary" />
            Video Content (Optional)
          </Typography>
          
          <TextField
            fullWidth
            label="Video URL"
            value={formData.content_url}
            onChange={(e) => setFormData({ ...formData, content_url: e.target.value, video_file: null, content_type: 'video' })}
            placeholder="https://www.youtube.com/watch?v=..."
            helperText="Paste a YouTube, Vimeo, or direct video URL"
            sx={{ mb: 2 }}
          />
          
          <Divider sx={{ my: 2 }}>
            <Chip label="OR" size="small" />
          </Divider>
          
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: formData.video_file ? 'success.main' : 'divider',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
              mb: 3,
            }}
          >
            <VideoLibrary sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="body2" sx={{ mb: 2 }}>
              {formData.video_file ? formData.video_file.name : 'Upload video file'}
            </Typography>
            <Button variant="contained" component="label" sx={{ textTransform: 'none' }}>
              Choose Video
              <input
                type="file"
                hidden
                accept="video/*"
                onChange={(e) => setFormData({ ...formData, video_file: e.target.files[0], content_url: '', document_file: null, content_type: 'video' })}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              Supported: MP4, AVI, MOV, WMV (Max 500MB)
            </Typography>
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* PDF Document Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PictureAsPdf color="info" />
            PDF Document (Optional)
          </Typography>
          
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: formData.document_file ? 'success.main' : 'divider',
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
              mb: 3,
            }}
          >
            <PictureAsPdf sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
            <Typography variant="body2" sx={{ mb: 2 }}>
              {formData.document_file ? formData.document_file.name : 'Upload lesson document'}
            </Typography>
            <Button variant="contained" component="label" sx={{ textTransform: 'none' }}>
              Choose Document
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => setFormData({ ...formData, document_file: e.target.files[0], video_file: null, content_url: '', content_type: 'pdf' })}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              Supported: PDF, DOC, DOCX, PPT, PPTX
            </Typography>
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* Text Content Section */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextFields color="success" />
            Text Content (Optional)
          </Typography>
          
          <TextField
            fullWidth
            label="Text Content"
            value={formData.content_type === 'text' ? formData.content_url : ''}
            onChange={(e) => setFormData({ ...formData, content_url: e.target.value, video_file: null, document_file: null, content_type: 'text' })}
            multiline
            rows={6}
            placeholder="Enter the lesson content here..."
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Order Index"
            type="number"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
            helperText="Determines the display order within the module"
          />
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
            {submitting ? 'Saving...' : editMode ? 'Update Lesson' : 'Create Lesson'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lesson Details</DialogTitle>
        <DialogContent>
          {selectedLesson && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {selectedLesson.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedLesson.description || 'No description'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2"><strong>Module:</strong> {selectedLesson.module_title}</Typography>
              <Typography variant="body2"><strong>Content Type:</strong> {selectedLesson.content_type}</Typography>
              <Typography variant="body2"><strong>Duration:</strong> {selectedLesson.duration_minutes} minutes</Typography>
              <Typography variant="body2"><strong>Order:</strong> {selectedLesson.order_index}</Typography>
              {selectedLesson.content_url && (
                <Typography variant="body2"><strong>Content URL:</strong> {selectedLesson.content_url}</Typography>
              )}
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
        <DialogTitle>Delete Lesson?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedLesson?.title}"? This action cannot be undone.
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

      {/* Send Notification Dialog */}
      <Dialog open={notificationDialogOpen} onClose={() => setNotificationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Send Lesson Notification
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Paper sx={{ p: 2, mb: 2, bgcolor: alpha('#43e97b', 0.1) }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              📢 Notify Students
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This notification will be sent to all students enrolled in the course. They will receive it in their notification center.
            </Typography>
          </Paper>

          <TextField
            fullWidth
            label="Notification Title"
            value={notificationData.title}
            onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
            sx={{ mb: 2 }}
            required
            placeholder="e.g., New Lesson Available"
          />
          
          <TextField
            fullWidth
            label="Message"
            value={notificationData.message}
            onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
            multiline
            rows={4}
            required
            placeholder="Write a message to inform students about this lesson..."
            helperText={`${notificationData.message.length}/500 characters`}
            inputProps={{ maxLength: 500 }}
          />

          {selectedLesson && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: alpha('#4facfe', 0.05) }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Lesson:</strong> {selectedLesson.title}<br />
                <strong>Module:</strong> {selectedLesson.module_title}<br />
                <strong>Course:</strong> {selectedLesson.course_title}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNotificationDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendNotification}
            disabled={submitting}
            startIcon={<Notifications />}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
              },
            }}
          >
            {submitting ? 'Sending...' : 'Send Notification'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LessonList;
