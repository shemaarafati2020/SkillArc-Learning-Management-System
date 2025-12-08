import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Paper,
  Button,
  IconButton,
  Avatar,
  Stack,
  CircularProgress,
  InputAdornment,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
} from '@mui/material';
import {
  Search,
  FilterList,
  Edit,
  Visibility,
  School,
  People,
  AccessTime,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { coursesAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const CourseManagement = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { isAdmin } = useAuth();

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Assign instructor dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [assignInstructorId, setAssignInstructorId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  const fetchInstructors = async () => {
    if (!isAdmin) return;
    try {
      const res = await usersAPI.getInstructors();
      const payload = res?.data?.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.users)
        ? payload.users
        : [];
      setInstructors(list);
    } catch (error) {
      console.error('Error loading instructors:', error);
      enqueueSnackbar('Failed to load instructors', { variant: 'error' });
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        // Request a high limit so admins can see essentially all courses
        const res = await coursesAPI.getAll({ limit: 1000, offset: 0 });
        if (res?.data?.success) {
          const payload = res.data.data;
          const list = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.courses)
            ? payload.courses
            : [];
          setCourses(list);
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

    fetchCourses();
    if (isAdmin) {
      fetchInstructors();
    }
  }, [enqueueSnackbar, isAdmin]);

  const categoryOptions = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [courses]);

  useEffect(() => {
    let data = Array.isArray(courses) ? [...courses] : [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((course) => {
        const title = course.title || '';
        const description = course.description || '';
        const instructor = course.instructor_name || '';
        return (
          title.toLowerCase().includes(q) ||
          description.toLowerCase().includes(q) ||
          instructor.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== 'all') {
      data = data.filter((course) => (course.status || 'published') === statusFilter);
    }

    if (categoryFilter !== 'all') {
      data = data.filter(
        (course) => course.category && course.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    if (sortBy === 'newest') {
      data.sort((a, b) => (b.course_id || 0) - (a.course_id || 0));
    } else if (sortBy === 'popular') {
      data.sort((a, b) => (b.enrolled_count || 0) - (a.enrolled_count || 0));
    } else if (sortBy === 'price_low') {
      data.sort(
        (a, b) => (parseFloat(a.price || 0) || 0) - (parseFloat(b.price || 0) || 0)
      );
    } else if (sortBy === 'price_high') {
      data.sort(
        (a, b) => (parseFloat(b.price || 0) || 0) - (parseFloat(a.price || 0) || 0)
      );
    }

    setFilteredCourses(data);
  }, [courses, searchQuery, statusFilter, categoryFilter, sortBy]);

  const handleOpenAssign = (course) => {
    if (!isAdmin) return;
    setSelectedCourse(course);
    setAssignInstructorId(course.instructor_id ? String(course.instructor_id) : '');
    setAssignDialogOpen(true);

    if (!instructors.length) {
      fetchInstructors();
    }
  };

  const handleCloseAssign = () => {
    setAssignDialogOpen(false);
    setSelectedCourse(null);
    setAssignInstructorId('');
    setAssignSaving(false);
  };

  const handleConfirmAssign = async () => {
    if (!selectedCourse || !assignInstructorId) return;
    setAssignSaving(true);
    try {
      const res = await coursesAPI.update(selectedCourse.course_id, {
        instructor_id: Number(assignInstructorId),
      });
      if (res?.data?.success) {
        const updated = res.data.data || res.data;
        setCourses((prev) =>
          prev.map((c) =>
            c.course_id === selectedCourse.course_id
              ? { ...c, ...updated }
              : c
          )
        );
        enqueueSnackbar('Instructor assigned successfully', { variant: 'success' });
        handleCloseAssign();
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to assign instructor', {
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error assigning instructor:', error);
      enqueueSnackbar('Error assigning instructor', { variant: 'error' });
    } finally {
      setAssignSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={56} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Course Management"
        subtitle={
          isAdmin
            ? 'Browse and manage all courses across the platform'
            : 'Browse and manage your courses'
        }
        actionText="Create Course"
        actionLink="/courses/create"
      />

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.9)
              : 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 60%, #fff9c4 100%)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by title, description, or instructor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All statuses</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All categories</MenuItem>
              {categoryOptions.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Sort by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="popular">Most popular</MenuItem>
              <MenuItem value="price_low">Price: Low to High</MenuItem>
              <MenuItem value="price_high">Price: High to Low</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={12} lg={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList color="action" />
              <Typography variant="body2" color="text.secondary">
                {filteredCourses.length} courses
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {filteredCourses.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {courses.length === 0
                ? 'No courses created yet'
                : 'No courses match your filters'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {courses.length === 0
                ? 'Start by creating a new course for your learners.'
                : 'Try adjusting your search or filter options.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid
          container
          spacing={3}
          component={motion.div}
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredCourses.map((course) => {
            const status = course.status || 'published';
            const priceValue = parseFloat(course.price || 0) || 0;
            const isFree = priceValue === 0;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={course.course_id}>
                <Card
                  component={motion.div}
                  variants={cardVariants}
                  whileHover={{ y: -8, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                  }}
                  onClick={() => navigate(`/courses/${course.course_id}`)}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={
                        course.thumbnail_url ||
                        'https://via.placeholder.com/400x180?text=Course+Thumbnail'
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
                        bottom: 8,
                        left: 8,
                        right: 8,
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
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                            color: '#fff',
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: '#fff',
                            textShadow: '0 4px 10px rgba(0,0,0,0.4)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {course.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={status === 'published' ? 'Published' : status === 'draft' ? 'Draft' : 'Archived'}
                        size="small"
                        color={status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'default'}
                      />
                    </Box>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28 }}>
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

                    <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <People sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {course.enrolled_count || 0} students
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {course.duration || 0}h
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Star sx={{ fontSize: 18, color: theme.palette.warning.main }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        4.5
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg rating
                      </Typography>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        {isFree ? 'Free' : `$${priceValue.toFixed(2)}`}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course.course_id}`);
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course.course_id}/edit`);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        {isAdmin && (
                          <Tooltip title="Assign instructor">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAssign(course);
                              }}
                            >
                              <People fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {isAdmin && (
        <Dialog
          open={assignDialogOpen}
          onClose={handleCloseAssign}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Assign Instructor</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Assign <strong>{selectedCourse?.title}</strong> to an instructor.
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Instructor</InputLabel>
              <Select
                label="Instructor"
                value={assignInstructorId}
                onChange={(e) => setAssignInstructorId(e.target.value)}
              >
                {instructors.map((inst) => (
                  <MenuItem key={inst.user_id} value={String(inst.user_id)}>
                    {inst.name} ({inst.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssign}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!assignInstructorId || assignSaving}
              onClick={handleConfirmAssign}
            >
              {assignSaving ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default CourseManagement;
