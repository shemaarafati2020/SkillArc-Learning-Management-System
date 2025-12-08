import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  Popover,
  Paper,
  Button,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  School,
  Assignment,
  Quiz,
  Forum,
  CardMembership,
  Person,
  Brightness4,
  Brightness7,
  Notifications,
  Logout,
  Settings,
  People,
  Analytics,
  History,
  AttachMoney,
  CheckCircle,
  Delete,
  MarkEmailRead,
  VideoLibrary,
  Description,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { notificationsAPI, modulesAPI, lessonsAPI, assignmentsAPI, quizzesAPI, forumsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const drawerWidth = 240;

const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `http://localhost${avatarUrl}`;
};

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin, isInstructor } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const { enqueueSnackbar } = useSnackbar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Content counts for instructors
  const [contentCounts, setContentCounts] = useState({
    modules: 0,
    lessons: 0,
    assignments: 0,
    quizzes: 0,
    forums: 0,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotificationClick = async (event) => {
    setNotifAnchorEl(event.currentTarget);
    await fetchNotifications();
  };

  const handleNotificationClose = () => {
    setNotifAnchorEl(null);
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await notificationsAPI.getAll({ limit: 10 });
      if (res?.data?.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      if (res?.data?.success) {
        setUnreadCount(res.data.data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await notificationsAPI.markAsRead(notifId);
      await fetchNotifications();
      enqueueSnackbar('Notification marked as read', { variant: 'success' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      enqueueSnackbar('Failed to mark as read', { variant: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      await fetchNotifications();
      enqueueSnackbar('All notifications marked as read', { variant: 'success' });
    } catch (error) {
      console.error('Error marking all as read:', error);
      enqueueSnackbar('Failed to mark all as read', { variant: 'error' });
    }
  };

  const handleDeleteNotification = async (notifId) => {
    try {
      await notificationsAPI.delete(notifId);
      await fetchNotifications();
      enqueueSnackbar('Notification deleted', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      enqueueSnackbar('Failed to delete notification', { variant: 'error' });
    }
  };

  const fetchContentCounts = async () => {
    if (!isInstructor) return;
    
    try {
      const [modulesRes, lessonsRes, assignmentsRes, quizzesRes, forumsRes] = await Promise.all([
        modulesAPI.getAll(),
        lessonsAPI.getAll(),
        assignmentsAPI.getAll(),
        quizzesAPI.getAll(),
        forumsAPI.getAll(),
      ]);
      
      setContentCounts({
        modules: modulesRes?.data?.data?.length || 0,
        lessons: lessonsRes?.data?.data?.length || 0,
        assignments: assignmentsRes?.data?.data?.length || 0,
        quizzes: quizzesRes?.data?.data?.length || 0,
        forums: forumsRes?.data?.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching content counts:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    if (isInstructor) {
      fetchContentCounts();
    }
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructor]);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['student', 'instructor', 'admin'] },
    { text: 'My Courses', icon: <School />, path: '/my-courses', roles: ['student', 'instructor'] },
    { text: 'Browse Courses', icon: <School />, path: '/courses', roles: ['student'] },
    { text: 'Modules', icon: <VideoLibrary />, path: '/modules', roles: ['instructor'], badge: contentCounts.modules },
    { text: 'Lessons', icon: <Description />, path: '/lessons', roles: ['instructor'], badge: contentCounts.lessons },
    { text: 'Assignments', icon: <Assignment />, path: '/assignments', roles: ['student', 'instructor'], badge: isInstructor ? contentCounts.assignments : null },
    { text: 'Quizzes', icon: <Quiz />, path: '/quizzes', roles: ['student', 'instructor'], badge: isInstructor ? contentCounts.quizzes : null },
    { text: 'Forums', icon: <Forum />, path: '/forums', roles: ['student', 'instructor'], badge: isInstructor ? contentCounts.forums : null },
    { text: 'Certificates', icon: <CardMembership />, path: '/certificates', roles: ['student'] },
    { divider: true, roles: ['admin'] },
    { text: 'User Management', icon: <People />, path: '/admin/users', roles: ['admin'] },
    { text: 'Course Management', icon: <School />, path: '/admin/courses', roles: ['admin'] },
    { text: 'Analytics', icon: <Analytics />, path: '/admin/analytics', roles: ['admin'] },
    { text: 'Payments', icon: <AttachMoney />, path: '/admin/payments', roles: ['admin'] },
    { text: 'Audit Logs', icon: <History />, path: '/admin/audit-logs', roles: ['admin'] },
    { text: 'Settings', icon: <Settings />, path: '/admin/settings', roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const drawer = (
    <Box>
      <Toolbar
        component={motion.div}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateX(2px)',
            transition: 'transform 0.2s ease-out',
          },
        }}
      >
        <School sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h6" noWrap component="div">
          SkillArc LMS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item, index) =>
          item.divider ? (
            <Divider key={index} sx={{ my: 1 }} />
          ) : (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={motion.div}
                whileHover={{ x: 6 }}
                whileTap={{ x: 0 }}
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 1,
                  my: 0.25,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {item.badge !== undefined && item.badge !== null && (
                  <Badge badgeContent={item.badge} color="primary" />
                )}
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
          </Typography>
          
          <Tooltip title="Toggle theme">
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationClick}>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Account">
            <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 1 }}>
              <Avatar
                src={getAvatarUrl(user?.avatar_url)}
                alt={user?.name || 'User avatar'}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: user?.avatar_url ? 'transparent' : 'secondary.main',
                }}
              >
                {!user?.avatar_url && (user?.name?.charAt(0) || 'U')}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notifAnchorEl)}
        anchorEl={notifAnchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 380, maxHeight: 500, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<MarkEmailRead />}
                onClick={handleMarkAllAsRead}
                sx={{ textTransform: 'none' }}
              >
                Mark all read
              </Button>
            )}
          </Box>

          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {loadingNotifications ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {notifications.map((notif) => (
                  <ListItem
                    key={notif.notif_id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: notif.is_read ? 'transparent' : alpha('#43a047', 0.05),
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                    secondaryAction={
                      <Box>
                        {!notif.is_read && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleMarkAsRead(notif.notif_id)}
                              sx={{ mr: 0.5 }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleDeleteNotification(notif.notif_id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: notif.is_read ? 400 : 700 }}>
                          {notif.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            {notif.message}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
                            {new Date(notif.sent_at).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Popover>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
