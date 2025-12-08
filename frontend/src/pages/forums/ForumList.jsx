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
  Forum,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  ChatBubbleOutline,
  Category,
  School,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { forumsAPI, coursesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ForumList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isInstructor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forums, setForums] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedForum, setSelectedForum] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    category: 'general',
  });

  useEffect(() => {
    fetchForums();
    if (isInstructor) {
      fetchCourses();
    }
  }, [isInstructor]);

  const fetchForums = async () => {
    setLoading(true);
    try {
      const res = await forumsAPI.getAll();
      if (res?.data?.success) {
        setForums(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching forums:', error);
      enqueueSnackbar('Error loading forums', { variant: 'error' });
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

  const handleOpenDialog = (forum = null) => {
    if (forum) {
      setEditMode(true);
      setSelectedForum(forum);
      setFormData({
        course_id: forum.course_id,
        title: forum.title,
        description: forum.description || '',
        category: forum.category || 'general',
      });
    } else {
      setEditMode(false);
      setSelectedForum(null);
      setFormData({
        course_id: '',
        title: '',
        description: '',
        category: 'general',
      });
    }
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedForum(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      enqueueSnackbar('Forum title is required', { variant: 'warning' });
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
        category: formData.category,
      };

      const res = editMode
        ? await forumsAPI.updateForum(selectedForum.forum_id, payload)
        : await forumsAPI.createForum(payload);

      if (res?.data?.success) {
        enqueueSnackbar(`Forum ${editMode ? 'updated' : 'created'} successfully!`, { variant: 'success' });
        handleCloseDialog();
        fetchForums();
      } else {
        enqueueSnackbar(`Failed to ${editMode ? 'update' : 'create'} forum`, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(`Error ${editMode ? 'updating' : 'creating'} forum`, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await forumsAPI.deleteForum(selectedForum.forum_id);
      if (res?.data?.success) {
        enqueueSnackbar('Forum deleted successfully!', { variant: 'success' });
        setDeleteDialogOpen(false);
        setSelectedForum(null);
        fetchForums();
      } else {
        enqueueSnackbar('Failed to delete forum', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error deleting forum', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event, forum) => {
    setAnchorEl(event.currentTarget);
    setSelectedForum(forum);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: '#4facfe',
      qa: '#43e97b',
      announcements: '#fa709a',
      assignments: '#667eea',
      projects: '#f093fb',
      resources: '#30cfd0',
    };
    return colors[category] || '#4facfe';
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
        title="Forums"
        subtitle={isInstructor ? "Manage course discussion forums" : "Discuss and collaborate with peers"}
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
              Create Forum
            </Button>
          )
        }
      />

      {forums.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Forum sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No forum discussions yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {isInstructor ? 'Create your first discussion forum' : 'Start a discussion or join existing threads'}
            </Typography>
            {isInstructor && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{ textTransform: 'none' }}
              >
                Create Forum
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          {courses.map((course) => {
            const courseForums = forums.filter(f => f.course_id === course.course_id);
            if (courseForums.length === 0) return null;
            
            return (
              <Box key={course.course_id} sx={{ mb: 4 }}>
                <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School />
                    {course.title}
                    <Chip 
                      label={`${courseForums.length} forum${courseForums.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
                    />
                  </Typography>
                </Paper>
                <Grid container spacing={3}>
                  {courseForums.map((forum) => (
            <Grid item xs={12} sm={6} md={4} key={forum.forum_id}>
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
                    borderColor: getCategoryColor(forum.category),
                  },
                }}
              >
                <Box
                  sx={{
                    height: 140,
                    background: `linear-gradient(135deg, ${getCategoryColor(forum.category)} 0%, ${alpha(getCategoryColor(forum.category), 0.7)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Forum sx={{ fontSize: 64, color: 'white', opacity: 0.9 }} />
                  {isInstructor && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, forum)}
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
                    label={(forum.category || 'general').toUpperCase()}
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
                    {forum.title}
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
                    {forum.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                      icon={<ChatBubbleOutline />}
                      label={`${forum.thread_count || 0} threads`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {forum.course_title || 'Course'}
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
        <MenuItem onClick={() => handleOpenDialog(selectedForum)}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Forum</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete Forum</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Forum />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editMode ? 'Edit Forum' : 'Create Discussion Forum'}
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
            label="Forum Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
            required
            placeholder="e.g., Week 1 Discussion, General Q&A"
          />
          
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={4}
            sx={{ mb: 2 }}
            placeholder="Describe the purpose of this forum and what students should discuss..."
          />
          
          <TextField
            fullWidth
            select
            label="Forum Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Saving...' : editMode ? 'Update Forum' : 'Create Forum'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Forum Details</DialogTitle>
        <DialogContent>
          {selectedForum && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {selectedForum.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedForum.description || 'No description'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2"><strong>Course:</strong> {selectedForum.course_title}</Typography>
              <Typography variant="body2"><strong>Category:</strong> {selectedForum.category || 'General'}</Typography>
              <Typography variant="body2"><strong>Threads:</strong> {selectedForum.thread_count || 0}</Typography>
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
        <DialogTitle>Delete Forum?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedForum?.title}"? This action cannot be undone and will delete all threads and replies.
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

export default ForumList;
