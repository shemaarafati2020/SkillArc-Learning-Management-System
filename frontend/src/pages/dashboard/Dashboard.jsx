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
  IconButton,
  Paper,
  Button,
  Divider,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  School,
  Assignment,
  Quiz,
  CardMembership,
  TrendingUp,
  CalendarToday,
  PlayArrow,
  CheckCircle,
  Timer,
  EmojiEvents,
  LocalFireDepartment,
  ArrowForward,
  People,
  Settings,
  BarChart,
  Security,
  Notifications,
  Assessment,
  Add,
  Forum,
  Grade,
  Edit,
  Visibility,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentsAPI, assignmentsAPI, quizzesAPI, certificatesAPI, coursesAPI, analyticsAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const Dashboard = () => {
  const { user, isInstructor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    assignments: 0,
    quizzes: 0,
    certificates: 0,
    averageProgress: 0,
    // Instructor stats
    totalCourses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    averageRating: 0,
    // Admin stats
    totalUsers: 0,
    totalInstructors: 0,
    activeStudents: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    publishedCourses: 0,
    systemHealth: 100,
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Admin Dashboard Data
      if (isAdmin) {
        const analyticsRes = await analyticsAPI
          .getDashboard()
          .catch(() => ({ data: { success: false, data: {} } }));

        const analytics = analyticsRes?.data?.success ? analyticsRes.data.data : {};

        const totalUsers = analytics.users || 0;
        const totalStudents = analytics.students || 0;
        const totalInstructors = analytics.instructors || 0;
        const totalCourses = analytics.courses || 0;
        const publishedCourses = analytics.published_courses || 0;
        const totalEnrollments = analytics.enrollments || 0;
        const activeEnrollments = analytics.active_enrollments || 0;
        const completedEnrollments = analytics.completed_enrollments || 0;
        const certificates = analytics.certificates || 0;

        // Derive a simple system health score from publish rate and completion rate
        let systemHealth = 100;
        if (totalEnrollments > 0 || totalCourses > 0) {
          const publishRate = totalCourses > 0 ? (publishedCourses / totalCourses) * 100 : 100;
          const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 100;
          const rawHealth = 0.5 * publishRate + 0.5 * completionRate;
          systemHealth = Math.max(0, Math.min(100, Math.round(Number.isFinite(rawHealth) ? rawHealth : 100)));
        }

        setStats(prevStats => ({
          ...prevStats,
          totalUsers,
          totalInstructors,
          activeStudents: totalStudents,
          totalCourses,
          publishedCourses,
          totalEnrollments,
          activeEnrollments,
          completedEnrollments,
          certificates,
          systemHealth,
        }));

        // Map recent analytics into a simple activity feed for future use
        const activity = [];
        if (Array.isArray(analytics.recent_enrollments)) {
          const enrollTotal = analytics.recent_enrollments.reduce((sum, e) => sum + (e.count || 0), 0);
          activity.push({
            id: 'recent-enrollments',
            type: 'enrollment',
            message: `${enrollTotal} new enrollments in the last 7 days`,
          });
        }
        if (Array.isArray(analytics.recent_completions)) {
          const completeTotal = analytics.recent_completions.reduce((sum, e) => sum + (e.count || 0), 0);
          activity.push({
            id: 'recent-completions',
            type: 'completion',
            message: `${completeTotal} course completions in the last 7 days`,
          });
        }
        if (activity.length) {
          setRecentActivity(activity);
        }

      // Instructor Dashboard Data
      } else if (isInstructor) {
        const [coursesRes] = await Promise.all([
          coursesAPI.getMyCourses().catch(() => ({ data: { success: false, data: [] } })),
        ]);

        const instructorCourses = coursesRes.data.success ? coursesRes.data.data : [];

        setStats(prevStats => ({
          ...prevStats,
          totalCourses: instructorCourses.length,
          totalStudents: instructorCourses.reduce(
            (sum, course) => sum + (parseInt(course.enrolled_count) || 0),
            0
          ),
          pendingSubmissions: 0, // TODO: Fetch from submissions API
          averageRating: 4.5, // TODO: Fetch from reviews API
        }));

        const coursesWithColors = instructorCourses
          .map((course, index) => ({
            id: course.course_id,
            title: course.title || 'Untitled Course',
            progress: 100, // Instructor courses are "complete" from their perspective
            color: ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0'][index % 4],
            instructor: user?.name || 'You',
            courseId: course.course_id,
            enrolledCount: course.enrolled_count || 0,
            status: course.status || 'active',
          }))
          .slice(0, 6);
        setRecentCourses(coursesWithColors);

      // Student Dashboard Data
      } else {
        // Fetch student data
        const [enrollmentsRes, assignmentsRes, quizzesRes, certificatesRes] = await Promise.all([
          enrollmentsAPI.getMyEnrollments().catch(() => ({ data: { success: false, data: [] } })),
          assignmentsAPI.getUpcoming().catch(() => ({ data: { success: false, data: [] } })),
          quizzesAPI.getByCourse('all').catch(() => ({ data: { success: false, data: [] } })),
          certificatesAPI.getMyCertificates().catch(() => ({ data: { success: false, data: [] } })),
        ]);

        // Process enrollments
        const enrollments = enrollmentsRes.data.success ? enrollmentsRes.data.data : [];
        const activeEnrollments = enrollments.filter(e => e.status === 'active');
        const completedEnrollments = enrollments.filter(e => e.status === 'completed');
        
        // Calculate average progress
        const avgProgress = activeEnrollments.length > 0
          ? Math.round(activeEnrollments.reduce((sum, e) => sum + parseFloat(e.progress_percent || 0), 0) / activeEnrollments.length)
          : 0;

        // Set stats
        setStats({
          enrolledCourses: activeEnrollments.length,
          completedCourses: completedEnrollments.length,
          assignments: assignmentsRes.data.success ? (assignmentsRes.data.data || []).length : 0,
          quizzes: quizzesRes.data.success ? (quizzesRes.data.data || []).length : 0,
          certificates: certificatesRes.data.success ? (certificatesRes.data.data || []).length : 0,
          averageProgress: avgProgress,
        });

        // Set recent courses (top 3 by progress)
        const coursesWithColors = activeEnrollments.map((course, index) => ({
          id: course.enroll_id,
          title: course.course_title || 'Untitled Course',
          progress: parseFloat(course.progress_percent || 0),
          color: ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0'][index % 4],
          instructor: course.instructor_name || 'Unknown Instructor',
          courseId: course.course_id,
        })).slice(0, 3);
        setRecentCourses(coursesWithColors);

        // Set upcoming deadlines (assignments + quizzes)
        const assignments = assignmentsRes.data.success ? assignmentsRes.data.data : [];
        const quizzes = quizzesRes.data.success ? quizzesRes.data.data : [];
        
        const deadlines = [
          ...assignments.map(a => ({
            id: `assignment-${a.assign_id}`,
            title: a.title,
            course: a.course_title || 'Course',
            dueDate: calculateDaysUntil(a.due_date),
            type: 'assignment',
            date: new Date(a.due_date),
          })),
          ...quizzes.map(q => ({
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

        // Calculate achievements based on actual data
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

        setAchievements(calculatedAchievements.length > 0 ? calculatedAchievements : [
          { id: 1, title: 'Getting Started', icon: '🎯', description: 'Begin your learning journey' },
        ]);

        // Calculate streak (mock for now - implement based on your login tracking)
        setStreak(7);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <Box
        component={motion.div}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Admin Welcome Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            p: { xs: 3, md: 5 },
            mb: 4,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(79, 172, 254, 0.4)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 25px 70px rgba(79, 172, 254, 0.5)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(30%, -30%)',
              animation: 'pulse 4s ease-in-out infinite',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(-30%, 30%)',
            },
            '@keyframes pulse': {
              '0%, 100%': { transform: 'translate(30%, -30%) scale(1)' },
              '50%': { transform: 'translate(30%, -30%) scale(1.1)' },
            },
          }}
        >
          <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12} md={8}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800, 
                  mb: 1.5,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                }}
              >
                Admin Dashboard 🛡️
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 0.95, 
                  mb: 3,
                  fontWeight: 400,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  letterSpacing: '0.01em',
                }}
              >
                Welcome back, {user?.name}! Manage your learning platform
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<People />}
                  label={`${stats.totalUsers} Total Users`}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)', 
                    backdropFilter: 'blur(10px)',
                    color: 'white', 
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    px: 1,
                    py: 2.5,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
                <Chip
                  icon={<Security />}
                  label={`${stats.systemHealth}% System Health`}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)', 
                    backdropFilter: 'blur(10px)',
                    color: 'white', 
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    px: 1,
                    py: 2.5,
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
              <Avatar
                sx={{
                  width: { xs: 90, md: 120 },
                  height: { xs: 90, md: 120 },
                  bgcolor: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  fontSize: { xs: 36, md: 48 },
                  fontWeight: 700,
                  border: '4px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  margin: { xs: '0 auto', md: '0 0 0 auto' },
                }}
              >
                {user?.name?.charAt(0)}
              </Avatar>
            </Grid>
          </Grid>
        </Paper>

        {/* Admin Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers || 0}
              icon={<People />}
              color="primary"
              onClick={() => navigate('/admin/users')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Students"
              value={stats.activeStudents || 0}
              icon={<School />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Instructors"
              value={stats.totalInstructors || 0}
              icon={<People />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Courses"
              value={stats.totalCourses || 0}
              icon={<School />}
              color="warning"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* System Overview */}
          <Grid item xs={12} lg={8}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 800,
                    fontSize: { xs: '1.3rem', md: '1.5rem' },
                    letterSpacing: '-0.01em',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 3,
                  }}
                >
                  System Overview
                </Typography>

                <Grid container spacing={3}>
                  {/* Platform Analytics */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: 'primary.light',
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(79, 172, 254, 0.2)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <BarChart sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            {stats.totalUsers || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Platform Users
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            Students: {stats.activeStudents || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Instructors: {stats.totalInstructors || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            Enrollments: {stats.totalEnrollments || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Completed: {stats.completedEnrollments || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Course Statistics */}
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: 'success.light',
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <School sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>
                            {stats.totalCourses || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Active Courses
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="caption" color="text.secondary">
                        Across all categories
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* System Health */}
                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: 'info.light',
                        background: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)',
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                        System Health
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={stats.systemHealth || 100}
                          sx={{
                            flexGrow: 1,
                            height: 12,
                            borderRadius: 10,
                            bgcolor: alpha('#4facfe', 0.2),
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                              borderRadius: 10,
                            },
                          }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'info.main', minWidth: 60 }}>
                          {stats.systemHealth || 100}%
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Admin Quick Actions */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Management Tools */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Settings sx={{ color: 'primary.main' }} />
                    Management Tools
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<People />}
                      onClick={() => navigate('/admin/users')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.light',
                          borderColor: 'primary.dark',
                        },
                      }}
                    >
                      User Management
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<School />}
                      onClick={() => navigate('/courses')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderColor: 'success.main',
                        color: 'success.main',
                        '&:hover': {
                          bgcolor: 'success.light',
                          borderColor: 'success.dark',
                        },
                      }}
                    >
                      Course Management
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assessment />}
                      onClick={() => navigate('/admin/analytics')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderColor: 'info.main',
                        color: 'info.main',
                        '&:hover': {
                          bgcolor: 'info.light',
                          borderColor: 'info.dark',
                        },
                      }}
                    >
                      Analytics
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Security />}
                      onClick={() => navigate('/admin/audit-logs')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderColor: 'warning.main',
                        color: 'warning.main',
                        '&:hover': {
                          bgcolor: 'warning.light',
                          borderColor: 'warning.dark',
                        },
                      }}
                    >
                      Audit Logs
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Settings />}
                      onClick={() => navigate('/admin/settings')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderColor: 'text.secondary',
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      System Settings
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* System Notifications */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '2px solid',
                  borderColor: '#FFD700',
                  background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE8CC 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Notifications sx={{ color: 'warning.main' }} />
                    System Alerts
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: 'white',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        All systems operational ✅
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last checked: Just now
                      </Typography>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Instructor Dashboard
  if (isInstructor) {
    return (
      <Box
        component={motion.div}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Instructor Welcome Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: { xs: 3, md: 4 },
            mb: 3,
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.25)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: '-30%',
              left: '-5%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
              borderRadius: '50%',
            },
          }}
        >
          <Grid container spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 0.5,
                      fontSize: { xs: '1.75rem', md: '2.125rem' },
                    }}
                  >
                    Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}!
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.9, 
                      mb: 2,
                      fontSize: '1.05rem',
                    }}
                  >
                    Here's what's happening with your courses today
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<People sx={{ fontSize: 18 }} />}
                      label={`${stats.totalStudents || 0} Students`}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white', 
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                    <Chip
                      icon={<School sx={{ fontSize: 18 }} />}
                      label={`${stats.totalCourses || 0} Courses`}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white', 
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                    <Chip
                      icon={<Star sx={{ fontSize: 18 }} />}
                      label={`${stats.averageRating || '4.5'} Rating`}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white', 
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    />
                  </Box>
                </Box>
                <Avatar
                  sx={{
                    width: { xs: 70, md: 80 },
                    height: { xs: 70, md: 80 },
                    bgcolor: 'rgba(255,255,255,0.2)',
                    fontSize: { xs: 28, md: 32 },
                    fontWeight: 700,
                    border: '3px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  }}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Instructor Stats */}
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
          {/* My Courses */}
          <Grid item xs={12} lg={8}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 800,
                      fontSize: { xs: '1.3rem', md: '1.5rem' },
                      letterSpacing: '-0.01em',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    My Courses
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<School />}
                    onClick={() => navigate('/courses/create')}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                      },
                    }}
                  >
                    Create Course
                  </Button>
                </Box>

                {recentCourses.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <School sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      No courses created yet
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/courses/create')}
                    >
                      Create Your First Course
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {recentCourses.map((course) => (
                      <Grid item xs={12} sm={6} key={course.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: (theme) => theme.palette.mode === 'dark'
                                ? '0 8px 24px rgba(240, 147, 251, 0.3)'
                                : '0 8px 24px rgba(0,0,0,0.12)',
                              borderColor: 'primary.main',
                            },
                          }}
                          onClick={() => navigate(`/courses/${course.courseId}`)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                                {course.title}
                              </Typography>
                              <Chip 
                                label={course.status === 'active' ? 'Active' : 'Draft'} 
                                size="small" 
                                color={course.status === 'active' ? 'success' : 'default'}
                                sx={{ ml: 1 }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <People sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {course.enrolledCount || 0} students
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Button
                                size="small"
                                startIcon={<Edit />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/courses/${course.courseId}/edit`);
                                }}
                                sx={{ textTransform: 'none' }}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                sx={{ textTransform: 'none' }}
                              >
                                View
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Quick Create Actions */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: (theme) => theme.palette.mode === 'dark' 
                      ? '0 12px 40px rgba(240, 147, 251, 0.3)' 
                      : '0 12px 40px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    <Add sx={{ color: '#f093fb' }} />
                    Quick Create
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<School />}
                        onClick={() => navigate('/courses/create')}
                        sx={{ 
                          textTransform: 'none', 
                          fontWeight: 700,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Course
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Quiz />}
                        onClick={() => navigate('/quizzes/create')}
                        sx={{ 
                          textTransform: 'none', 
                          fontWeight: 700,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 20px rgba(240, 147, 251, 0.4)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Quiz
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Assignment />}
                        onClick={() => navigate('/assignments/create')}
                        sx={{ 
                          textTransform: 'none', 
                          fontWeight: 700,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 20px rgba(79, 172, 254, 0.4)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Assignment
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Forum />}
                        onClick={() => navigate('/forums/create')}
                        sx={{ 
                          textTransform: 'none', 
                          fontWeight: 700,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #fee140 0%, #fa709a 100%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 20px rgba(250, 112, 154, 0.4)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Forum
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Management Tools */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Settings sx={{ color: 'primary.main' }} />
                    Manage
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Grade />}
                      onClick={() => navigate('/assignments/grade')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderWidth: 2,
                        py: 1.2,
                        color: 'warning.main',
                        borderColor: 'warning.main',
                        '&:hover': {
                          borderWidth: 2,
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(255, 152, 0, 0.15)' 
                            : 'warning.lighter',
                          borderColor: 'warning.dark',
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Grade Assignments
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => navigate('/courses')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderWidth: 2,
                        py: 1.2,
                        color: 'primary.main',
                        borderColor: 'primary.main',
                        '&:hover': {
                          borderWidth: 2,
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(102, 126, 234, 0.15)' 
                            : 'primary.lighter',
                          borderColor: 'primary.dark',
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      View All Courses
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Forum />}
                      onClick={() => navigate('/forums')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderWidth: 2,
                        py: 1.2,
                        color: 'success.main',
                        borderColor: 'success.main',
                        '&:hover': {
                          borderWidth: 2,
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(76, 175, 80, 0.15)' 
                            : 'success.lighter',
                          borderColor: 'success.dark',
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Manage Forums
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<People />}
                      onClick={() => navigate('/students')}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        borderWidth: 2,
                        py: 1.2,
                        color: 'info.main',
                        borderColor: 'info.main',
                        '&:hover': {
                          borderWidth: 2,
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(33, 150, 243, 0.15)' 
                            : 'info.lighter',
                          borderColor: 'info.dark',
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      View Students
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Performance Stats */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '2px solid',
                  borderColor: (theme) => theme.palette.mode === 'dark' 
                    ? 'rgba(240, 147, 251, 0.3)' 
                    : '#f093fb',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%)'
                    : 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '150px',
                    height: '150px',
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'radial-gradient(circle, rgba(240, 147, 251, 0.2) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(240, 147, 251, 0.3) 0%, transparent 70%)',
                    borderRadius: '50%',
                    transform: 'translate(30%, -30%)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Star sx={{ color: '#f093fb' }} />
                    Your Performance
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.05)' 
                          : 'white',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Average Rating
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star sx={{ color: '#FFD700', fontSize: 20 }} />
                          <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFD700' }}>
                            {stats.averageRating || '4.5'}
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(parseFloat(stats.averageRating || 4.5) / 5) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 10,
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(255, 215, 0, 0.2)' 
                            : alpha('#FFD700', 0.2),
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                            borderRadius: 10,
                          },
                        }}
                      />
                    </Paper>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.05)' 
                          : 'white',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Total Students Taught
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {stats.totalStudents || 0}
                      </Typography>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>

              {/* Quick Analytics */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                    : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 800, 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <TrendingUp sx={{ color: 'success.main' }} />
                    Quick Stats
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Completion Rate
                      </Typography>
                      <Chip 
                        label="87%" 
                        size="small" 
                        color="success"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Engagement Score
                      </Typography>
                      <Chip 
                        label="92%" 
                        size="small" 
                        color="primary"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Response Time
                      </Typography>
                      <Chip 
                        label="< 2h" 
                        size="small" 
                        color="info"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Recent Activity & Upcoming Events */}
        <Grid container spacing={3} sx={{ mt: 0 }}>
          {/* Recent Activity Feed */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Notifications sx={{ color: 'primary.main' }} />
                  Recent Activity
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { 
                      icon: <Assignment sx={{ color: 'warning.main' }} />, 
                      text: 'New assignment submission from John Doe',
                      time: '5 min ago',
                      color: 'warning.main'
                    },
                    { 
                      icon: <Forum sx={{ color: 'success.main' }} />, 
                      text: 'New forum post in "Web Development"',
                      time: '15 min ago',
                      color: 'success.main'
                    },
                    { 
                      icon: <People sx={{ color: 'info.main' }} />, 
                      text: '3 new students enrolled in React Course',
                      time: '1 hour ago',
                      color: 'info.main'
                    },
                    { 
                      icon: <Quiz sx={{ color: 'error.main' }} />, 
                      text: 'Quiz "JavaScript Basics" completed by 15 students',
                      time: '2 hours ago',
                      color: 'error.main'
                    },
                  ].map((activity, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: activity.color,
                          bgcolor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.03)'
                            : 'rgba(0,0,0,0.02)',
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Avatar
                          sx={{
                            bgcolor: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.05)',
                            width: 40,
                            height: 40,
                          }}
                        >
                          {activity.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {activity.text}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Events & Deadlines */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CalendarToday sx={{ color: 'error.main' }} />
                  Upcoming Deadlines
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { 
                      title: 'Grade Assignment: React Project',
                      course: 'Web Development Bootcamp',
                      date: 'Tomorrow',
                      priority: 'high'
                    },
                    { 
                      title: 'Course Module Release',
                      course: 'JavaScript Masterclass',
                      date: 'Dec 5, 2025',
                      priority: 'medium'
                    },
                    { 
                      title: 'Live Session: Q&A',
                      course: 'Node.js Backend',
                      date: 'Dec 6, 2025',
                      priority: 'medium'
                    },
                    { 
                      title: 'Quiz Review Deadline',
                      course: 'Data Science with Python',
                      date: 'Dec 8, 2025',
                      priority: 'low'
                    },
                  ].map((event, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '2px solid',
                        borderColor: event.priority === 'high' 
                          ? 'error.main' 
                          : event.priority === 'medium' 
                          ? 'warning.main' 
                          : 'success.main',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.03)'
                            : 'rgba(0,0,0,0.02)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {event.title}
                        </Typography>
                        <Chip 
                          label={event.priority.toUpperCase()} 
                          size="small"
                          color={
                            event.priority === 'high' 
                              ? 'error' 
                              : event.priority === 'medium' 
                              ? 'warning' 
                              : 'success'
                          }
                          sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {event.course}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {event.date}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions Bar */}
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 4,
            border: '2px solid',
            borderColor: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(102, 126, 234, 0.3)'
              : '#667eea',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Need Help?
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<School />}
                sx={{ 
                  py: 1.5, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 }
                }}
              >
                Documentation
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Forum />}
                sx={{ 
                  py: 1.5, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 }
                }}
              >
                Support Forum
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Notifications />}
                sx={{ 
                  py: 1.5, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 }
                }}
              >
                Announcements
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Settings />}
                onClick={() => navigate('/settings')}
                sx={{ 
                  py: 1.5, 
                  textTransform: 'none', 
                  fontWeight: 600,
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 }
                }}
              >
                Settings
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  }

  // Student Dashboard
  return (
    <Box
      component={motion.div}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Header with Advanced Gradient */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 25px 70px rgba(102, 126, 234, 0.5)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
            animation: 'pulse 4s ease-in-out infinite',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(-30%, 30%)',
          },
          '@keyframes pulse': {
            '0%, 100%': { transform: 'translate(30%, -30%) scale(1)' },
            '50%': { transform: 'translate(30%, -30%) scale(1.1)' },
          },
        }}
      >
        <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={8}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800, 
                mb: 1.5,
                fontSize: { xs: '2rem', md: '2.5rem' },
                letterSpacing: '-0.02em',
                textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                background: 'linear-gradient(to right, #ffffff 0%, rgba(255,255,255,0.8) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                opacity: 0.95, 
                mb: 3,
                fontWeight: 400,
                fontSize: { xs: '1rem', md: '1.1rem' },
                letterSpacing: '0.01em',
              }}
            >
              You're doing great! Keep up the momentum and achieve your goals.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<LocalFireDepartment sx={{ animation: 'flicker 1.5s infinite' }} />}
                label={`${streak} Day Streak`}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.25)', 
                  backdropFilter: 'blur(10px)',
                  color: 'white', 
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  px: 1,
                  py: 2.5,
                  border: '1px solid rgba(255,255,255,0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.35)',
                    transform: 'translateY(-2px)',
                  },
                  '@keyframes flicker': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                  },
                }}
              />
              <Chip
                icon={<EmojiEvents />}
                label={`${achievements.length} Achievements`}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.25)', 
                  backdropFilter: 'blur(10px)',
                  color: 'white', 
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  px: 1,
                  py: 2.5,
                  border: '1px solid rgba(255,255,255,0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.35)',
                    transform: 'translateY(-2px)',
                  },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
            <Avatar
              sx={{
                width: { xs: 90, md: 120 },
                height: { xs: 90, md: 120 },
                bgcolor: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                fontSize: { xs: 36, md: 48 },
                fontWeight: 700,
                border: '4px solid rgba(255,255,255,0.4)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
                margin: { xs: '0 auto', md: '0 0 0 auto' },
                '&:hover': {
                  transform: 'scale(1.05) rotate(5deg)',
                  boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
                },
              }}
            >
              {user?.name?.charAt(0)}
            </Avatar>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Enrolled Courses"
            value={stats.enrolledCourses}
            icon={<School />}
            color="primary"
            onClick={() => navigate('/my-courses')}
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
        {/* Continue Learning */}
        <Grid item xs={12} lg={8}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              transition: 'all 0.3s ease',
              background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 800,
                    fontSize: { xs: '1.3rem', md: '1.5rem' },
                    letterSpacing: '-0.01em',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Continue Learning
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/my-courses')}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: '#667eea',
                    '&:hover': {
                      bgcolor: 'rgba(102, 126, 234, 0.08)',
                    },
                  }}
                >
                  View All
                </Button>
              </Box>

              {recentCourses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <School sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No courses enrolled yet
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/courses')}
                  >
                    Browse Courses
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {recentCourses.map((course, index) => (
                    <Box key={course.id}>
                      {index > 0 && <Divider sx={{ my: 2 }} />}
                      <ListItem
                        onClick={() => navigate(`/courses/${course.courseId}`)}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          borderRadius: 3,
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            bgcolor: course.color,
                            borderRadius: '4px 0 0 4px',
                            transform: 'scaleY(0)',
                            transition: 'transform 0.3s ease',
                          },
                          '&:hover': {
                            bgcolor: alpha(course.color, 0.06),
                            transform: 'translateX(12px)',
                            boxShadow: `0 8px 24px ${alpha(course.color, 0.15)}`,
                            '&::before': {
                              transform: 'scaleY(1)',
                            },
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: alpha(course.color, 0.1),
                              color: course.color,
                              width: 56,
                              height: 56,
                            }}
                          >
                            <School />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 700, 
                                mb: 0.5,
                                fontSize: '1.05rem',
                                letterSpacing: '-0.01em',
                                color: 'text.primary',
                              }}
                            >
                              {course.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                sx={{ 
                                  display: 'block', 
                                  mb: 1.5,
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                }}
                              >
                                👨‍🏫 {course.instructor}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={course.progress}
                                  sx={{
                                    flexGrow: 1,
                                    height: 10,
                                    borderRadius: 10,
                                    bgcolor: alpha(course.color, 0.12),
                                    boxShadow: `inset 0 2px 4px ${alpha(course.color, 0.1)}`,
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: course.color,
                                      borderRadius: 10,
                                      background: `linear-gradient(90deg, ${course.color} 0%, ${alpha(course.color, 0.8)} 100%)`,
                                      boxShadow: `0 2px 8px ${alpha(course.color, 0.3)}`,
                                      transition: 'all 0.3s ease',
                                    },
                                  }}
                                />
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontWeight: 800, 
                                    minWidth: 45,
                                    fontSize: '0.9rem',
                                    color: course.color,
                                  }}
                                >
                                  {course.progress}%
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <IconButton
                          sx={{
                            bgcolor: alpha(course.color, 0.1),
                            color: course.color,
                            '&:hover': { bgcolor: alpha(course.color, 0.2) },
                          }}
                        >
                          <PlayArrow />
                        </IconButton>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Upcoming Deadlines */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 2.5,
                    fontSize: '1.25rem',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CalendarToday sx={{ fontSize: 24, color: 'primary.main' }} />
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
                  <List sx={{ p: 0 }}>
                    {upcomingDeadlines.map((item, index) => (
                    <Box key={item.id}>
                      {index > 0 && <Divider sx={{ my: 1.5 }} />}
                      <ListItem sx={{ p: 0, alignItems: 'flex-start' }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: item.type === 'assignment' ? 'warning.light' : 'info.light',
                              color: item.type === 'assignment' ? 'warning.dark' : 'info.dark',
                              width: 40,
                              height: 40,
                            }}
                          >
                            {item.type === 'assignment' ? <Assignment fontSize="small" /> : <Quiz fontSize="small" />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {item.course}
                              </Typography>
                              <Chip
                                icon={<Timer />}
                                label={item.dueDate}
                                size="small"
                                sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
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

            {/* Achievements */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '2px solid',
                borderColor: '#FFD700',
                background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE8CC 100%)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 12px 40px rgba(255, 215, 0, 0.3)',
                  transform: 'translateY(-2px)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '150px',
                  height: '150px',
                  background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)',
                  borderRadius: '50%',
                  transform: 'translate(30%, -30%)',
                },
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 2.5,
                    fontSize: '1.25rem',
                    letterSpacing: '-0.01em',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  🏆 Recent Achievements
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {achievements.map((achievement, index) => (
                    <Paper
                      key={achievement.id}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        bgcolor: 'white',
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: alpha('#FFD700', 0.3),
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        animation: `fadeInUp 0.5s ease ${index * 0.1}s both`,
                        '@keyframes fadeInUp': {
                          from: {
                            opacity: 0,
                            transform: 'translateY(20px)',
                          },
                          to: {
                            opacity: 1,
                            transform: 'translateY(0)',
                          },
                        },
                        '&:hover': {
                          borderColor: '#FFD700',
                          boxShadow: '0 8px 24px rgba(255, 215, 0, 0.2)',
                          transform: 'translateY(-4px) scale(1.02)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            fontSize: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: alpha('#FFD700', 0.15),
                            border: '2px solid',
                            borderColor: alpha('#FFD700', 0.3),
                          }}
                        >
                          {achievement.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 700,
                              fontSize: '1rem',
                              mb: 0.5,
                              letterSpacing: '-0.01em',
                            }}
                          >
                            {achievement.title}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: 500,
                            }}
                          >
                            {achievement.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;