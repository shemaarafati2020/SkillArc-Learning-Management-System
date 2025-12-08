import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Paper,
  CircularProgress,
  List,
  Divider,
} from '@mui/material';
import {
  School,
  Assignment,
  EmojiEvents,
  People,
  Add,
  Quiz,
  Forum,
  Notifications,
  Info,
  Warning,
  CheckCircleOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    averageRating: 4.5,
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const coursesRes = await coursesAPI
          .getMyCourses()
          .catch(() => ({ data: { success: false, data: [] } }));

        const instructorCourses = coursesRes.data.success ? coursesRes.data.data : [];

        setStats((prev) => ({
          ...prev,
          totalCourses: instructorCourses.length,
          totalStudents: instructorCourses.reduce(
            (sum, course) => sum + (parseInt(course.enrolled_count) || 0),
            0
          ),
          // pendingSubmissions and averageRating could be wired to real APIs later
        }));

        const coursesWithMeta = instructorCourses
          .map((course) => ({
            id: course.course_id,
            title: course.title || 'Untitled Course',
            enrolledCount: course.enrolled_count || 0,
            status: course.status || 'active',
          }))
          .slice(0, 6);

        setRecentCourses(coursesWithMeta);

        // Generate instructor notifications
        const newNotifications = [];
        
        // New student enrollments
        const totalEnrolled = instructorCourses.reduce(
          (sum, course) => sum + (parseInt(course.enrolled_count) || 0),
          0
        );
        if (totalEnrolled > 0) {
          newNotifications.push({
            id: 'enrollment-update',
            type: 'success',
            title: 'New Student Enrollments',
            message: `${totalEnrolled} students enrolled in your courses`,
            time: '2 hours ago',
          });
        }

        // Pending submissions reminder
        if (stats.pendingSubmissions > 0) {
          newNotifications.push({
            id: 'pending-submissions',
            type: 'warning',
            title: 'Pending Submissions',
            message: `${stats.pendingSubmissions} assignments waiting for review`,
            time: '3 hours ago',
          });
        }

        // Course performance
        newNotifications.push({
          id: 'course-performance',
          type: 'info',
          title: 'Course Analytics Updated',
          message: 'View your latest course performance metrics',
          time: '1 day ago',
        });

        setNotifications(newNotifications);
      } catch (error) {
        console.error('Error fetching instructor dashboard data:', error);
        enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [enqueueSnackbar]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box component={motion.div} variants={pageVariants} initial="hidden" animate="visible">
      <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, mb: 4, borderRadius: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
              Welcome, Professor {user?.name?.split(' ')[0]}! 👨‍🏫
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.95, mb: 3 }}>
              Inspire and educate your students today.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip icon={<School />} label={`${stats.totalCourses} Active Courses`} />
              <Chip icon={<People />} label={`${stats.totalStudents} Students`} />
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
            <Avatar sx={{ width: 90, height: 90, fontSize: 36, fontWeight: 700 }}>
              {user?.name?.charAt(0)}
            </Avatar>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents || 0}
            icon={<School />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Courses"
            value={stats.totalCourses || 0}
            icon={<School />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Submissions"
            value={stats.pendingSubmissions || 0}
            icon={<Assignment />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Rating"
            value={stats.averageRating || '4.5'}
            icon={<EmojiEvents />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  My Assigned Courses
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<School />}
                  onClick={() => navigate('/my-courses')}
                  sx={{ textTransform: 'none' }}
                >
                  Manage Content
                </Button>
              </Box>

              {recentCourses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <School sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No courses assigned yet. Contact an admin to get courses assigned.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Once assigned, you can add lessons, assignments, quizzes, and forums.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {recentCourses.map((course) => (
                    <Grid item xs={12} sm={6} key={course.id}>
                      <Card
                        sx={{
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                        onClick={() => navigate(`/courses/${course.id}`)}
                      >
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            {course.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {course.enrolledCount || 0} students
                          </Typography>
                          <Chip
                            label={course.status === 'active' ? 'Active' : 'Draft'}
                            size="small"
                            color={course.status === 'active' ? 'success' : 'default'}
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          {/* Notifications Card */}
          <Card elevation={0} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications sx={{ color: 'primary.main' }} />
                Notifications
              </Typography>
              {notifications.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckCircleOutline sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No new notifications
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {notifications.map((notif) => (
                    <Box key={notif.id}>
                      <Divider sx={{ my: 1 }} />
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: notif.type === 'warning' ? 'warning.light' : notif.type === 'success' ? 'success.light' : 'info.light',
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(255,255,255,0.03)' 
                            : notif.type === 'warning' ? 'warning.lighter' : notif.type === 'success' ? 'success.lighter' : 'info.lighter',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateX(4px)',
                            boxShadow: 1,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: notif.type === 'warning' ? 'warning.main' : notif.type === 'success' ? 'success.main' : 'info.main',
                            }}
                          >
                            {notif.type === 'warning' ? <Warning fontSize="small" /> : notif.type === 'success' ? <CheckCircleOutline fontSize="small" /> : <Info fontSize="small" />}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {notif.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              {notif.message}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
                              {notif.time}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Quick Create
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                To add content to your courses:
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<School />}
                    onClick={() => navigate('/my-courses')}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Go to My Courses
                  </Button>
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                From there, you can add assignments, quizzes, forums, and lessons to each course.
              </Typography>
            </CardContent>
          </Card>

          <Card elevation={0}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Teaching Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You have taught {stats.totalStudents || 0} students across {stats.totalCourses || 0} courses.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InstructorDashboard;
