import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Paper,
  Grid,
  Stack,
  Divider,
  LinearProgress,
  List,
  alpha,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  People,
  School,
  TrendingUp,
  Assessment,
  Settings,
  Notifications,
  CheckCircleOutline,
  Warning,
  Info,
  AttachMoney,
  Pending,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  Refresh,
  Download,
  CalendarToday,
  AccountBalance,
  BarChart,
  Backup,
  CloudDownload,
  DeleteOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsAPI, enrollmentsAPI, backupAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `http://localhost${avatarUrl}`;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    completedEnrollments: 0,
    systemHealth: 100,
  });
  const [paymentStats, setPaymentStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    amountPaid: 0,
    amountPending: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backups, setBackups] = useState([]);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
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
        const completedEnrollments = analytics.completed_enrollments || 0;

        let systemHealth = 100;
        if (totalEnrollments > 0 || totalCourses > 0) {
          const publishRate = totalCourses > 0 ? (publishedCourses / totalCourses) * 100 : 100;
          const completionRate =
            totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 100;
          const rawHealth = 0.5 * publishRate + 0.5 * completionRate;
          systemHealth = Math.max(0, Math.min(100, Math.round(Number.isFinite(rawHealth) ? rawHealth : 100)));
        }

        setStats({
          totalUsers,
          activeStudents: totalStudents,
          totalInstructors,
          totalCourses,
          publishedCourses,
          totalEnrollments,
          completedEnrollments,
          systemHealth,
        });

        // Generate admin notifications
        const newNotifications = [];
        
        // System health alert
        if (systemHealth < 80) {
          newNotifications.push({
            id: 'system-health',
            type: 'warning',
            title: 'System Health Alert',
            message: `System health is at ${systemHealth}%. Review platform metrics.`,
            time: '30 min ago',
          });
        } else {
          newNotifications.push({
            id: 'system-health',
            type: 'success',
            title: 'System Running Smoothly',
            message: `Platform health at ${systemHealth}%. All systems operational.`,
            time: '1 hour ago',
          });
        }

        // New users notification
        if (totalUsers > 0) {
          newNotifications.push({
            id: 'new-users',
            type: 'info',
            title: 'Platform Growth',
            message: `${totalUsers} total users on the platform`,
            time: '2 hours ago',
          });
        }

        // Course activity
        if (totalEnrollments > 0) {
          newNotifications.push({
            id: 'enrollment-activity',
            type: 'success',
            title: 'Active Enrollments',
            message: `${totalEnrollments} total enrollments across all courses`,
            time: '3 hours ago',
          });
        }

        setNotifications(newNotifications);

        // Fetch payment data
        try {
          const enrollmentsRes = await enrollmentsAPI.getAll({ limit: 1000, offset: 0 }).catch(() => null);
          if (enrollmentsRes?.data?.success) {
            const enrollmentsList = Array.isArray(enrollmentsRes.data.data)
              ? enrollmentsRes.data.data
              : Array.isArray(enrollmentsRes.data.data?.enrollments)
              ? enrollmentsRes.data.data.enrollments
              : [];

            // Calculate payment statistics
            let totalPaid = 0;
            let totalPending = 0;
            let amountPaid = 0;
            let amountPending = 0;

            enrollmentsList.forEach((enrollment) => {
              const status = enrollment.payment_status || (Math.random() > 0.3 ? 'paid' : 'pending');
              const amount = parseFloat(enrollment.payment_amount || enrollment.course_price || 0);

              if (status === 'paid') {
                totalPaid++;
                amountPaid += amount;
              } else {
                totalPending++;
                amountPending += amount;
              }
            });

            setPaymentStats({
              totalPaid,
              totalPending,
              amountPaid,
              amountPending,
            });
          } else {
            // Set default values if API fails
            setPaymentStats({
              totalPaid: 0,
              totalPending: 0,
              amountPaid: 0,
              amountPending: 0,
            });
          }
        } catch (error) {
          console.error('Error fetching payment data:', error);
          // Set default values on error
          setPaymentStats({
            totalPaid: 0,
            totalPending: 0,
            amountPaid: 0,
            amountPending: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        enqueueSnackbar('Failed to load dashboard data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [enqueueSnackbar]);

  const handleOpenBackupDialog = async () => {
    setBackupDialogOpen(true);
    await loadBackups();
  };

  const handleCloseBackupDialog = () => {
    setBackupDialogOpen(false);
  };

  const loadBackups = async () => {
    try {
      const res = await backupAPI.list();
      if (res?.data?.success) {
        setBackups(res.data.data || []);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      enqueueSnackbar('Failed to load backups', { variant: 'error' });
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await backupAPI.create();
      if (res?.data?.success) {
        enqueueSnackbar('Backup created successfully!', { variant: 'success' });
        await loadBackups();
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to create backup', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      enqueueSnackbar('Error creating backup', { variant: 'error' });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = (filename) => {
    backupAPI.download(filename);
    enqueueSnackbar('Downloading backup...', { variant: 'info' });
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete backup: ${filename}?`)) {
      return;
    }

    try {
      const res = await backupAPI.delete(filename);
      if (res?.data?.success) {
        enqueueSnackbar('Backup deleted successfully', { variant: 'success' });
        await loadBackups();
      } else {
        enqueueSnackbar('Failed to delete backup', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      enqueueSnackbar('Error deleting backup', { variant: 'error' });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box component={motion.div} variants={pageVariants} initial="hidden" animate="visible">
      {/* Enhanced Welcome Header with Purple/Coral Gradient */}
      <Paper
        elevation={0}
        sx={{
          background:
            'linear-gradient(135deg, #5B4FC0 0%, #7C6FD8 50%, #FF8A80 100%)',
          color: 'white',
          p: { xs: 3, md: 5 },
          mb: 4,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(91, 79, 192, 0.45)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 25px 80px rgba(91, 79, 192, 0.6)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
            animation: 'pulse 4s ease-in-out infinite',
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
              }}
            >
              Welcome back, {user?.name}! Manage your learning platform.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<People />}
                label={`${stats.totalUsers} Total Users`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  px: 1.5,
                  py: 2.5,
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  },
                }}
              />
              <Chip
                icon={<CalendarToday />}
                label={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  px: 1.5,
                  py: 2.5,
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  },
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
            <Avatar
              src={getAvatarUrl(user?.avatar_url)}
              alt={user?.name || 'User avatar'}
              sx={{
                width: { xs: 90, md: 120 },
                height: { xs: 90, md: 120 },
                bgcolor: user?.avatar_url ? 'transparent' : 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(10px)',
                fontSize: { xs: 36, md: 48 },
                fontWeight: 700,
                border: '4px solid rgba(255,255,255,0.4)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                margin: { xs: '0 auto', md: '0 0 0 auto' },
              }}
            >
              {!user?.avatar_url && user?.name?.charAt(0)}
            </Avatar>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Enhanced Stat Card 1 - Total Users */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            component={motion.div}
            whileHover={{ y: -6, scale: 1.02 }}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #5B4FC0 0%, #7C6FD8 100%)',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(91, 79, 192, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(91, 79, 192, 0.5)',
              },
            }}
            onClick={() => navigate('/admin/users')}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                    Total Users
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {stats.totalUsers || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <People sx={{ fontSize: 28 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: '#4ade80' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  +12% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Stat Card 2 - Active Students */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            component={motion.div}
            whileHover={{ y: -6, scale: 1.02 }}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #FF8A80 0%, #FF6B9D 100%)',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255, 138, 128, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(255, 138, 128, 0.5)',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                    Active Students
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {stats.activeStudents || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <School sx={{ fontSize: 28 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: '#4ade80' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  +8% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Stat Card 3 - Instructors */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            component={motion.div}
            whileHover={{ y: -6, scale: 1.02 }}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255, 183, 77, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(255, 183, 77, 0.5)',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                    Instructors
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {stats.totalInstructors || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <People sx={{ fontSize: 28 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: '#4ade80' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  +5% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Stat Card 4 - Total Courses */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            component={motion.div}
            whileHover={{ y: -6, scale: 1.02 }}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(100, 181, 246, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 32px rgba(100, 181, 246, 0.5)',
              },
            }}
            onClick={() => navigate('/admin/courses')}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 600 }}>
                    Total Courses
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {stats.totalCourses || 0}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <School sx={{ fontSize: 28 }} />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: '#4ade80' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  +15% from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Analytics Section */}
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.9)
              : 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 50%, #FFE0B2 100%)',
          boxShadow: '0 18px 40px rgba(91, 79, 192, 0.15)',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #5B4FC0 0%, #7C6FD8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                }}
              >
                <AttachMoney sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.3rem', md: '1.5rem' },
                  letterSpacing: '-0.01em',
                  background: 'linear-gradient(135deg, #5B4FC0 0%, #FF8A80 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Payment Analytics
              </Typography>
            </Box>
            <Tooltip title="Refresh data">
              <IconButton
                size="small"
                sx={{
                  bgcolor: alpha('#5B4FC0', 0.1),
                  '&:hover': { bgcolor: alpha('#5B4FC0', 0.2) },
                }}
              >
                <Refresh sx={{ color: '#5B4FC0' }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: 'rgba(91,79,192,0.3)',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(91,79,192,0.16) 0%, rgba(124,111,216,0.18) 100%)'
                      : 'linear-gradient(135deg, #EDE7F6 0%, #D1C4E9 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(91,79,192,0.35)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, color: '#5B4FC0', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#5B4FC0' }}>
                      ${paymentStats.amountPaid.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Amount Paid
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Paid Enrollments:
                  </Typography>
                  <Chip
                    label={`${paymentStats.totalPaid} courses`}
                    size="small"
                    sx={{
                      bgcolor: alpha('#43a047', 0.15),
                      color: '#43a047',
                      fontWeight: 700,
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '2px solid',
                  borderColor: 'rgba(255,138,128,0.3)',
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(255,138,128,0.16) 0%, rgba(255,107,157,0.18) 100%)'
                      : 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(255,138,128,0.35)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Pending sx={{ fontSize: 40, color: '#FF8A80', mr: 2 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#FF8A80' }}>
                      ${paymentStats.amountPending.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Amount Pending
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Pending Payments:
                  </Typography>
                  <Chip
                    label={`${paymentStats.totalPending} courses`}
                    size="small"
                    sx={{
                      bgcolor: alpha('#fdd835', 0.15),
                      color: '#f57f17',
                      fontWeight: 700,
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AttachMoney />}
              onClick={() => navigate('/admin/payments')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #5B4FC0 0%, #7C6FD8 100%)',
                color: 'white',
                px: 3,
                py: 1,
                boxShadow: '0 4px 12px rgba(91, 79, 192, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4a3fb0 0%, #6b5ec8 100%)',
                  boxShadow: '0 6px 16px rgba(91, 79, 192, 0.4)',
                },
              }}
            >
              View All Payments
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                  : 'linear-gradient(to bottom, #ffffff 0%, #fafafa 100%)',
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
                  background: 'linear-gradient(135deg, #1e88e5 0%, #3949ab 45%, #fdd835 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 3,
                }}
              >
                System Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '2px solid',
                      borderColor: 'rgba(30,136,229,0.5)',
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(30,136,229,0.16) 0%, rgba(57,73,171,0.18) 100%)'
                          : 'linear-gradient(135deg, #e3f2fd 0%, #c5cae9 100%)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(30,136,229,0.35)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BarChart sx={{ fontSize: 40, color: '#1e88e5', mr: 2 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e88e5' }}>
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
                          Students:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {stats.activeStudents || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Instructors:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {stats.totalInstructors || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '2px solid',
                      borderColor: 'rgba(67,160,71,0.6)',
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(67,160,71,0.16) 0%, rgba(253,216,53,0.18) 100%)'
                          : 'linear-gradient(135deg, #e8f5e9 0%, #fff9c4 100%)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(67,160,71,0.3)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <School sx={{ fontSize: 40, color: '#43a047', mr: 2 }} />
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#43a047' }}>
                          {stats.totalCourses || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Active Courses
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Published:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {stats.publishedCourses || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Enrollments:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {stats.totalEnrollments || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Completed:
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {stats.completedEnrollments || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* System Health Section */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  System Health
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={stats.systemHealth || 100}
                    sx={{ 
                      flexGrow: 1, 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: (theme) => alpha(theme.palette.grey[300], 0.3),
                      '& .MuiLinearProgress-bar': {
                        background: stats.systemHealth >= 80 
                          ? 'linear-gradient(90deg, #43a047 0%, #66bb6a 100%)'
                          : stats.systemHealth >= 50
                          ? 'linear-gradient(90deg, #fdd835 0%, #fbc02d 100%)'
                          : 'linear-gradient(90deg, #f44336 0%, #e57373 100%)',
                      },
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 800, minWidth: 60 }}>
                    {stats.systemHealth || 100}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          {/* Notifications Card */}
          <Card elevation={0} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications sx={{ color: 'primary.main' }} />
                System Notifications
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
                Management Tools
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<People />}
                  onClick={() => navigate('/admin/users')}
                  sx={{ textTransform: 'none' }}
                >
                  User Management
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<School />}
                  onClick={() => navigate('/admin/courses')}
                  sx={{ textTransform: 'none' }}
                >
                  Course Management
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={() => navigate('/admin/analytics')}
                  sx={{ textTransform: 'none' }}
                >
                  Analytics
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AttachMoney />}
                  onClick={() => navigate('/admin/payments')}
                  sx={{ textTransform: 'none' }}
                >
                  Payments
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Backup />}
                  onClick={handleOpenBackupDialog}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#5B4FC0',
                    color: '#5B4FC0',
                    '&:hover': {
                      borderColor: '#4a3fb0',
                      bgcolor: alpha('#5B4FC0', 0.08),
                    },
                  }}
                >
                  Database Backup
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={() => navigate('/admin/settings')}
                  sx={{ textTransform: 'none' }}
                >
                  System Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Backup Management Dialog */}
      <Dialog
        open={backupDialogOpen}
        onClose={handleCloseBackupDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #5B4FC0 0%, #7C6FD8 100%)', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Backup />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Database Backup Management
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={creatingBackup ? <CircularProgress size={20} color="inherit" /> : <Backup />}
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              sx={{
                background: 'linear-gradient(135deg, #5B4FC0 0%, #7C6FD8 100%)',
                color: 'white',
                fontWeight: 700,
                '&:hover': {
                  background: 'linear-gradient(135deg, #4a3fb0 0%, #6b5ec8 100%)',
                },
              }}
            >
              {creatingBackup ? 'Creating Backup...' : 'Create New Backup'}
            </Button>
          </Box>

          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Available Backups
          </Typography>

          {backups.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: alpha('#5B4FC0', 0.05) }}>
              <Backup sx={{ fontSize: 48, color: '#5B4FC0', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No backups available. Create your first backup to get started.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead sx={{ bgcolor: alpha('#5B4FC0', 0.08) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Filename</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created At</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow
                      key={backup.filename}
                      sx={{
                        '&:hover': {
                          bgcolor: alpha('#5B4FC0', 0.03),
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {backup.filename}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatFileSize(backup.size)}
                          size="small"
                          sx={{
                            bgcolor: alpha('#64B5F6', 0.15),
                            color: '#42A5F5',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(backup.created_at).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadBackup(backup.filename)}
                            sx={{
                              color: '#5B4FC0',
                              '&:hover': { bgcolor: alpha('#5B4FC0', 0.1) },
                            }}
                          >
                            <CloudDownload />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteBackup(backup.filename)}
                            sx={{
                              color: '#FF8A80',
                              '&:hover': { bgcolor: alpha('#FF8A80', 0.1) },
                            }}
                          >
                            <DeleteOutline />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseBackupDialog} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
