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
  VideoLibrary,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  School,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { modulesAPI, coursesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const ModuleList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isInstructor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    order_index: 1,
  });

  useEffect(() => {
    fetchModules();
    fetchCourses();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await modulesAPI.getAll();
      if (res?.data?.success) {
        setModules(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      enqueueSnackbar('Error loading modules', { variant: 'error' });
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

  const handleOpenDialog = (module = null) => {
    if (module) {
      setEditMode(true);
      setSelectedModule(module);
      setFormData({
        course_id: module.course_id,
        title: module.title,
        description: module.description || '',
        order_index: module.order_index || 1,
      });
    } else {
      setEditMode(false);
      setSelectedModule(null);
      setFormData({
        course_id: '',
        title: '',
        description: '',
        order_index: 1,
      });
    }
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedModule(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      enqueueSnackbar('Module title is required', { variant: 'warning' });
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
        order_index: formData.order_index,
        is_published: false,
      };

      const res = editMode
        ? await modulesAPI.update(selectedModule.module_id, payload)
        : await modulesAPI.create(payload);

      if (res?.data?.success) {
        enqueueSnackbar(`Module ${editMode ? 'updated' : 'created'} successfully!`, { variant: 'success' });
        handleCloseDialog();
        fetchModules();
      } else {
        enqueueSnackbar(`Failed to ${editMode ? 'update' : 'create'} module`, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(`Error ${editMode ? 'updating' : 'creating'} module`, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await modulesAPI.delete(selectedModule.module_id);
      if (res?.data?.success) {
        enqueueSnackbar('Module deleted successfully!', { variant: 'success' });
        setDeleteDialogOpen(false);
        setSelectedModule(null);
        fetchModules();
      } else {
        enqueueSnackbar('Failed to delete module', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error deleting module', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event, module) => {
    setAnchorEl(event.currentTarget);
    setSelectedModule(module);
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
        title="Modules"
        subtitle="Manage your course modules"
        actions={
          isInstructor && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                },
              }}
            >
              Create Module
            </Button>
          )
        }
      />

      {modules.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No modules created yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first module to organize your course content
            </Typography>
            {isInstructor && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{ textTransform: 'none' }}
              >
                Create Module
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          {courses.map((course) => {
            const courseModules = modules.filter(m => m.course_id === course.course_id);
            if (courseModules.length === 0) return null;
            
            return (
              <Box key={course.course_id} sx={{ mb: 4 }}>
                <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School />
                    {course.title}
                    <Chip 
                      label={`${courseModules.length} module${courseModules.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
                    />
                  </Typography>
                </Paper>
                <Grid container spacing={3}>
                  {courseModules.map((module) => (
            <Grid item xs={12} sm={6} md={4} key={module.module_id}>
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <VideoLibrary sx={{ fontSize: 64, color: 'white', opacity: 0.9 }} />
                  {isInstructor && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, module)}
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
                </Box>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {module.title}
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
                    {module.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<School />}
                      label={module.course_title || 'Course'}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Order: ${module.order_index || 1}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
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
        <MenuItem onClick={() => handleOpenDialog(selectedModule)}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Module</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete Module</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideoLibrary />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editMode ? 'Edit Module' : 'Create New Module'}
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
            label="Module Title"
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
            rows={4}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Order Index"
            type="number"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
            helperText="Determines the display order of modules"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Paper sx={{ p: 2, bgcolor: alpha('#667eea', 0.1) }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Modules are organizational containers for lessons. Add video content and documents through individual lessons within this module.
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
            {submitting ? 'Saving...' : editMode ? 'Update Module' : 'Create Module'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Module Details</DialogTitle>
        <DialogContent>
          {selectedModule && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {selectedModule.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedModule.description || 'No description'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2"><strong>Course:</strong> {selectedModule.course_title}</Typography>
              <Typography variant="body2"><strong>Order:</strong> {selectedModule.order_index}</Typography>
              {selectedModule.video_url && (
                <Typography variant="body2"><strong>Video URL:</strong> {selectedModule.video_url}</Typography>
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
        <DialogTitle>Delete Module?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedModule?.title}"? This action cannot be undone.
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

export default ModuleList;
