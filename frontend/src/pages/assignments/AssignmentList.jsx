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
  Assignment,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  AttachFile,
  CalendarToday,
  Grade,
  School,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { assignmentsAPI, coursesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AssignmentList = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isInstructor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    max_score: 100,
    attachment_file: null,
  });

  useEffect(() => {
    fetchAssignments();
    if (isInstructor) {
      fetchCourses();
    }
  }, [isInstructor]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await assignmentsAPI.getAll();
      if (res?.data?.success) {
        setAssignments(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      enqueueSnackbar('Error loading assignments', { variant: 'error' });
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

  const handleOpenDialog = (assignment = null) => {
    if (assignment) {
      setEditMode(true);
      setSelectedAssignment(assignment);
      setFormData({
        course_id: assignment.course_id,
        title: assignment.title,
        description: assignment.description || '',
        instructions: assignment.instructions || '',
        due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : '',
        max_score: assignment.max_score || 100,
        attachment_file: null,
      });
    } else {
      setEditMode(false);
      setSelectedAssignment(null);
      setFormData({
        course_id: '',
        title: '',
        description: '',
        instructions: '',
        due_date: '',
        max_score: 100,
        attachment_file: null,
      });
    }
    setDialogOpen(true);
    setAnchorEl(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setSelectedAssignment(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      enqueueSnackbar('Assignment title is required', { variant: 'warning' });
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
        instructions: formData.instructions,
        due_date: formData.due_date || null,
        max_score: formData.max_score,
        is_published: false,
      };

      const res = editMode
        ? await assignmentsAPI.update(selectedAssignment.assign_id, payload)
        : await assignmentsAPI.create(payload);

      if (res?.data?.success) {
        enqueueSnackbar(`Assignment ${editMode ? 'updated' : 'created'} successfully!`, { variant: 'success' });
        handleCloseDialog();
        fetchAssignments();
      } else {
        enqueueSnackbar(`Failed to ${editMode ? 'update' : 'create'} assignment`, { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar(`Error ${editMode ? 'updating' : 'creating'} assignment`, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await assignmentsAPI.delete(selectedAssignment.assign_id);
      if (res?.data?.success) {
        enqueueSnackbar('Assignment deleted successfully!', { variant: 'success' });
        setDeleteDialogOpen(false);
        setSelectedAssignment(null);
        fetchAssignments();
      } else {
        enqueueSnackbar('Failed to delete assignment', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Error deleting assignment', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event, assignment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssignment(assignment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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
        title="Assignments"
        subtitle={isInstructor ? "Manage course assignments" : "View and submit assignments"}
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
              Create Assignment
            </Button>
          )
        }
      />

      {assignments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No assignments available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {isInstructor ? 'Create your first assignment' : 'Check back later for new assignments'}
            </Typography>
            {isInstructor && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{ textTransform: 'none' }}
              >
                Create Assignment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          {courses.map((course) => {
            const courseAssignments = assignments.filter(a => a.course_id === course.course_id);
            if (courseAssignments.length === 0) return null;
            
            return (
              <Box key={course.course_id} sx={{ mb: 4 }}>
                <Paper sx={{ p: 2, mb: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School />
                    {course.title}
                    <Chip 
                      label={`${courseAssignments.length} assignment${courseAssignments.length !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ ml: 'auto', bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
                    />
                  </Typography>
                </Paper>
                <Grid container spacing={3}>
                  {courseAssignments.map((assignment) => (
            <Grid item xs={12} sm={6} md={4} key={assignment.assign_id}>
              <Card
                component={motion.div}
                whileHover={{ y: -4 }}
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: isOverdue(assignment.due_date) ? 'error.main' : 'divider',
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
                    background: isOverdue(assignment.due_date)
                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Assignment sx={{ fontSize: 64, color: 'white', opacity: 0.9 }} />
                  {isInstructor && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, assignment)}
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
                  {isOverdue(assignment.due_date) && (
                    <Chip
                      label="OVERDUE"
                      size="small"
                      color="error"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Box>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {assignment.title}
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
                    {assignment.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                      icon={<Grade />}
                      label={`${assignment.max_score} pts`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    {assignment.due_date && (
                      <Chip
                        icon={<CalendarToday />}
                        label={new Date(assignment.due_date).toLocaleDateString()}
                        size="small"
                        variant="outlined"
                        color={isOverdue(assignment.due_date) ? 'error' : 'default'}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {assignment.course_title || 'Course'}
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
        <MenuItem onClick={() => handleOpenDialog(selectedAssignment)}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Assignment</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}>
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete Assignment</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editMode ? 'Edit Assignment' : 'Create New Assignment'}
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
            label="Assignment Title"
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
            placeholder="Brief description of the assignment"
          />

          <TextField
            fullWidth
            label="Detailed Instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
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
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Score"
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData({ ...formData, max_score: parseInt(e.target.value) })}
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
              borderColor: formData.attachment_file ? 'success.main' : 'divider',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <AttachFile sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="body2" sx={{ mb: 2 }}>
              {formData.attachment_file ? formData.attachment_file.name : 'Upload assignment files, templates, or resources'}
            </Typography>
            <Button variant="contained" component="label" sx={{ textTransform: 'none' }}>
              Choose File
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.zip"
                onChange={(e) => setFormData({ ...formData, attachment_file: e.target.files[0] })}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              PDF, DOC, DOCX, ZIP (Max 25MB)
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
            {submitting ? 'Saving...' : editMode ? 'Update Assignment' : 'Create Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assignment Details</DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {selectedAssignment.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedAssignment.description || 'No description'}
              </Typography>
              {selectedAssignment.instructions && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
                    Instructions:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedAssignment.instructions}
                  </Typography>
                </>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2"><strong>Course:</strong> {selectedAssignment.course_title}</Typography>
              <Typography variant="body2"><strong>Max Score:</strong> {selectedAssignment.max_score} points</Typography>
              {selectedAssignment.due_date && (
                <Typography variant="body2">
                  <strong>Due Date:</strong> {new Date(selectedAssignment.due_date).toLocaleString()}
                  {isOverdue(selectedAssignment.due_date) && (
                    <Chip label="OVERDUE" size="small" color="error" sx={{ ml: 1 }} />
                  )}
                </Typography>
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
        <DialogTitle>Delete Assignment?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedAssignment?.title}"? This action cannot be undone.
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

export default AssignmentList;
