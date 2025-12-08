import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  CardMedia,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  School,
  Assignment,
  Quiz,
  CardMembership,
  TrendingUp,
  CalendarToday,
  CheckCircle,
  Timer,
  EmojiEvents,
  LocalFireDepartment,
  ArrowForward,
  Notifications,
  Info,
  Warning,
  CheckCircleOutline,
  Search,
  FilterList,
  People,
  AccessTime,
  Star,
  VideoLibrary,
  Description,
  Forum,
  ExpandMore,
  PlayCircleOutline,
  CheckCircleRounded,
  LockOutlined,
  MenuBook,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentsAPI, assignmentsAPI, quizzesAPI, certificatesAPI, coursesAPI, modulesAPI, lessonsAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const calculateDaysUntil = (dueDate) => {
  if (!dueDate) return 'No deadline';
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays} days`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return `${Math.ceil(diffDays / 30)} months`;
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    assignments: 0,
    quizzes: 0,
    certificates: 0,
    averageProgress: 0,
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // New states for course browsing and enrollment
  const [activeTab, setActiveTab] = useState(0);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [courseModules, setCourseModules] = useState([]);
  const [courseLessons, setCourseLessons] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [enrollmentsRes, assignmentsRes, quizzesRes, certificatesRes] = await Promise.all([
          enrollmentsAPI.getMyEnrollments().catch(() => ({ data: { success: false, data: [] } })),
          assignmentsAPI.getUpcoming().catch(() => ({ data: { success: false, data: [] } })),
          quizzesAPI.getByCourse('all').catch(() => ({ data: { success: false, data: [] } })),
          certificatesAPI.getMyCertificates().catch(() => ({ data: { success: false, data: [] } })),
        ]);

        const enrollments = enrollmentsRes.data.success ? enrollmentsRes.data.data : [];
        const activeEnrollments = enrollments.filter((e) => e.status === 'active');
        const completedEnrollments = enrollments.filter((e) => e.status === 'completed');

        const avgProgress =
          activeEnrollments.length > 0
            ? Math.round(
                activeEnrollments.reduce(
                  (sum, e) => sum + parseFloat(e.progress_percent || 0),
                  0
                ) / activeEnrollments.length
              )
            : 0;

        setStats({
          enrolledCourses: activeEnrollments.length,
          completedCourses: completedEnrollments.length,
          assignments: assignmentsRes.data.success ? (assignmentsRes.data.data || []).length : 0,
          quizzes: quizzesRes.data.success ? (quizzesRes.data.data || []).length : 0,
          certificates: certificatesRes.data.success ? (certificatesRes.data.data || []).length : 0,
          averageProgress: avgProgress,
        });

        const coursesWithColors = activeEnrollments
          .map((course, index) => ({
            id: course.enroll_id,
            title: course.course_title || 'Untitled Course',
            progress: parseFloat(course.progress_percent || 0),
            color: ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0'][index % 4],
            instructor: course.instructor_name || 'Unknown Instructor',
            courseId: course.course_id,
          }))
          .slice(0, 3);
        setRecentCourses(coursesWithColors);

        const assignments = assignmentsRes.data.success ? assignmentsRes.data.data : [];
        const quizzes = quizzesRes.data.success ? quizzesRes.data.data : [];

        const deadlines = [
          ...assignments.map((a) => ({
            id: `assignment-${a.assign_id}`,
            title: a.title,
            course: a.course_title || 'Course',
            dueDate: calculateDaysUntil(a.due_date),
            type: 'assignment',
            date: new Date(a.due_date),
          })),
          ...quizzes.map((q) => ({
            id: `quiz-${q.quiz_id}`,
            title: q.title,
            course: q.course_title || 'Course',
            dueDate: calculateDaysUntil(q.due_date),
            type: 'quiz',
            date: new Date(q.due_date),
          })),
        ]
          .sort((a, b) => a.date - b.date)
          .slice(0, 5);

        setUpcomingDeadlines(deadlines);

        const calculatedAchievements = [];
        if (completedEnrollments.length >= 3) {
          calculatedAchievements.push({
            id: 1,
            title: 'Fast Learner',
            icon: '🚀',
            description: `Completed ${completedEnrollments.length} courses`,
          });
        }
        if (avgProgress >= 80) {
          calculatedAchievements.push({
            id: 2,
            title: 'High Achiever',
            icon: '💯',
            description: `${avgProgress}% average progress`,
          });
        }
        if (activeEnrollments.length >= 3) {
          calculatedAchievements.push({
            id: 3,
            title: 'Dedicated Learner',
            icon: '🔥',
            description: `Enrolled in ${activeEnrollments.length} courses`,
          });
        }
        setAchievements(
          calculatedAchievements.length > 0
            ? calculatedAchievements
            : [
                {
                  id: 1,
                  title: 'Getting Started',
                  icon: '🎯',
                  description: 'Begin your learning journey',
                },
              ]
        );

        setStreak(7);

        // Generate notifications based on data
        const newNotifications = [];
        
        // Upcoming deadline notifications
        deadlines.slice(0, 3).forEach((deadline) => {
          if (deadline.dueDate === 'Today' || deadline.dueDate === 'Tomorrow') {
            newNotifications.push({
              id: `deadline-${deadline.id}`,
              type: 'warning',
              title: `${deadline.type === 'assignment' ? 'Assignment' : 'Quiz'} Due ${deadline.dueDate}`,
              message: deadline.title,
              time: deadline.dueDate,
            });
          }
        });

        // New achievement notification
        if (calculatedAchievements.length > 0) {
          newNotifications.push({
            id: 'achievement-new',
            type: 'success',
            title: 'New Achievement Unlocked!',
            message: calculatedAchievements[0].title,
            time: 'Just now',
          });
        }

        // Course progress notification
        if (avgProgress >= 75) {
          newNotifications.push({
            id: 'progress-high',
            type: 'info',
            title: 'Great Progress!',
            message: `You're ${avgProgress}% through your courses`,
            time: '1 hour ago',
          });
        }

        setNotifications(newNotifications);
        
        // Store enrolled course IDs
        setEnrolledCourseIds(enrollments.map(e => e.course_id));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchAvailableCourses();
  }, [enqueueSnackbar]);

  const fetchAvailableCourses = async () => {
    try {
      const response = await coursesAPI.getAll({ limit: 100, offset: 0 });
      if (response?.data?.success) {
        const payload = response.data.data;
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.courses) ? payload.courses : [];
        // Filter only published courses
        const publishedCourses = list.filter(c => c.status === 'published');
        setAvailableCourses(publishedCourses);
      }
    } catch (error) {
      console.error('Error fetching available courses:', error);
    }
  };

  const handleViewCourse = async (course) => {
    setSelectedCourse(course);
    setCourseDialogOpen(true);
    
    // Fetch course content
    try {
      const [modulesRes, lessonsRes] = await Promise.all([
        modulesAPI.getByCourse(course.course_id).catch(() => ({ data: { success: false, data: [] } })),
        lessonsAPI.getByCourse(course.course_id).catch(() => ({ data: { success: false, data: [] } })),
      ]);
      
      if (modulesRes?.data?.success) {
        setCourseModules(modulesRes.data.data || []);
      }
      if (lessonsRes?.data?.success) {
        setCourseLessons(lessonsRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching course content:', error);
    }
  };

  const handleEnroll = async (course = null) => {
    const courseToEnroll = course || selectedCourse;
    if (!courseToEnroll) return;
    
    setEnrolling(true);
    try {
      console.log('Enrolling in course:', courseToEnroll.course_id);
      const response = await enrollmentsAPI.enroll(courseToEnroll.course_id);
      console.log('Enrollment response:', response);
      
      if (response?.data?.success) {
        enqueueSnackbar('Successfully enrolled in course!', { variant: 'success' });
        setCourseDialogOpen(false);
        setEnrolledCourseIds([...enrolledCourseIds, courseToEnroll.course_id]);
        // Refresh dashboard data
        window.location.reload();
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

  const filteredAvailableCourses = availableCourses.filter(course => 
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isEnrolled = (courseId) => enrolledCourseIds.includes(courseId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box component={motion.div} variants={pageVariants} initial="hidden" animate="visible">
      {/* Header Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 4 }, 
          mb: 3, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.95, mb: 3 }}>
              Continue your learning journey and achieve your goals.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<LocalFireDepartment />} 
                label={`${streak} Day Streak`} 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
              <Chip 
                icon={<EmojiEvents />} 
                label={`${achievements.length} Achievements`} 
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
            <Avatar sx={{ width: 90, height: 90, fontSize: 36, fontWeight: 700, bgcolor: 'rgba(255,255,255,0.3)' }}>
              {user?.name?.charAt(0)}
            </Avatar>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs Navigation */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
          }}
        >
          <Tab icon={<TrendingUp />} iconPosition="start" label="Overview" />
          <Tab icon={<Search />} iconPosition="start" label="Browse Courses" />
          <Tab icon={<MenuBook />} iconPosition="start" label="My Courses" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Enrolled Courses"
                value={stats.enrolledCourses}
                icon={<School />}
                color="primary"
                onClick={() => setActiveTab(2)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Pending Assignments"
                value={stats.assignments}
                icon={<Assignment />}
                color="warning"
                onClick={() => navigate('/assignments')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg Progress"
                value={`${stats.averageProgress}%`}
                icon={<TrendingUp />}
                color="info"
                progress={stats.averageProgress}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Certificates"
                value={stats.certificates}
                icon={<CardMembership />}
                color="success"
                onClick={() => navigate('/certificates')}
              />
            </Grid>
          </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Continue Learning
                </Typography>
                <Button endIcon={<ArrowForward />} onClick={() => navigate('/my-courses')} sx={{ textTransform: 'none' }}>
                  View All
                </Button>
              </Box>
              {recentCourses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <School sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No courses enrolled yet
                  </Typography>
                  <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/courses')}>
                    Browse Courses
                  </Button>
                </Box>
              ) : (
                <List>
                  {recentCourses.map((course) => (
                    <Box key={course.id}>
                      <Divider />
                      <ListItem onClick={() => navigate(`/courses/${course.courseId}`)} sx={{ cursor: 'pointer' }}>
                        <ListItemAvatar>
                          <Avatar>
                            <School />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={course.title}
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                👨‍🏫 {course.instructor}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress variant="determinate" value={course.progress} sx={{ flexGrow: 1 }} />
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                  {course.progress}%
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
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
                Upcoming Deadlines
              </Typography>
              {upcomingDeadlines.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No upcoming deadlines
                  </Typography>
                </Box>
              ) : (
                <List>
                  {upcomingDeadlines.map((item) => (
                    <Box key={item.id}>
                      <Divider />
                      <ListItem sx={{ alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar>
                            {item.type === 'assignment' ? <Assignment fontSize="small" /> : <Quiz fontSize="small" />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.title}
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {item.course}
                              </Typography>
                              <Chip
                                icon={<Timer />}
                                label={item.dueDate}
                                size="small"
                                sx={{ mt: 0.5, height: 22, fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          <Card elevation={0}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Recent Achievements
              </Typography>
              {achievements.map((achievement) => (
                <Paper key={achievement.id} elevation={0} sx={{ p: 2, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ fontSize: 32 }}>{achievement.icon}</Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {achievement.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
        </Box>
      )}

      {/* Browse Courses Tab */}
      {activeTab === 1 && (
        <Box>
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <TextField
              fullWidth
              placeholder="Search available courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>

          {filteredAvailableCourses.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No courses available
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {filteredAvailableCourses.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course.course_id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 6,
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => handleViewCourse(course)}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image={course.thumbnail_url || 'https://via.placeholder.com/400x180?text=Course'}
                      alt={course.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Chip label={course.category || 'General'} size="small" color="primary" />
                        <Chip label={course.level || 'Beginner'} size="small" variant="outlined" />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {course.description?.substring(0, 100)}...
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <People sx={{ fontSize: 16 }} />
                          <Typography variant="caption">{course.enrolled_count || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 16 }} />
                          <Typography variant="caption">{course.duration || 0}h</Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                          {course.price === '0' || !course.price ? 'Free' : `$${course.price}`}
                        </Typography>
                        <Tooltip title="View course details">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCourse(course);
                            }}
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {isEnrolled(course.course_id) ? (
                        <Button
                          variant="outlined"
                          fullWidth
                          disabled
                          startIcon={<CheckCircleRounded />}
                          sx={{ mt: 1 }}
                        >
                          Already Enrolled
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnroll(course);
                          }}
                          disabled={enrolling}
                          sx={{ 
                            mt: 1,
                            fontWeight: 700,
                            textTransform: 'none',
                          }}
                        >
                          {enrolling ? 'Enrolling...' : 'Enroll Now'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* My Courses Tab */}
      {activeTab === 2 && (
        <Box>
          {recentCourses.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  You haven't enrolled in any courses yet
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(1)}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {recentCourses.map((course) => (
                <Grid item xs={12} md={6} key={course.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => navigate(`/courses/${course.courseId}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: course.color }}>
                          <School />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {course.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            👨‍🏫 {course.instructor}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {course.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={course.progress} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Button 
                        variant="outlined" 
                        fullWidth 
                        sx={{ mt: 2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${course.courseId}`);
                        }}
                      >
                        Continue Learning
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Course Detail Dialog */}
      <Dialog 
        open={courseDialogOpen} 
        onClose={() => setCourseDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedCourse && (
          <>
            <DialogTitle sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
            }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedCourse.title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {selectedCourse.category} • {selectedCourse.level}
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                About this course
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedCourse.description}
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <AccessTime sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {selectedCourse.duration || 0}h
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Duration
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <People sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {selectedCourse.enrolled_count || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Students
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Course Content
              </Typography>
              
              {courseModules.length === 0 && courseLessons.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                  <Info sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Course content will be available after enrollment
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  {courseModules.map((module, index) => (
                    <Accordion key={module.module_id} defaultExpanded={index === 0}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VideoLibrary color="primary" />
                          <Typography sx={{ fontWeight: 600 }}>{module.title}</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {module.description}
                        </Typography>
                        {courseLessons
                          .filter(lesson => lesson.module_id === module.module_id)
                          .map((lesson) => (
                            <Box 
                              key={lesson.lesson_id} 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                p: 1,
                                borderRadius: 1,
                                '&:hover': { bgcolor: 'action.hover' }
                              }}
                            >
                              <Description fontSize="small" color="action" />
                              <Typography variant="body2">{lesson.title}</Typography>
                            </Box>
                          ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setCourseDialogOpen(false)}>
                Close
              </Button>
              {!isEnrolled(selectedCourse.course_id) && (
                <Button 
                  variant="contained" 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  sx={{ minWidth: 120 }}
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </Button>
              )}
              {isEnrolled(selectedCourse.course_id) && (
                <Button 
                  variant="contained" 
                  onClick={() => {
                    setCourseDialogOpen(false);
                    navigate(`/courses/${selectedCourse.course_id}`);
                  }}
                >
                  Go to Course
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default StudentDashboard;
