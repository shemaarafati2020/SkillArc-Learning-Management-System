import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Typography,
  useTheme,
  alpha,
  InputBase,
} from '@mui/material';
import {
  Search,
  Notifications,
  AccountCircle,
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
  Language,
  Settings,
  Logout,
  Dashboard,
  School,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';

const ModernNavbar = ({ onMenuClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotifMenuOpen = (event) => {
    setNotifAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotifAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backdropFilter: 'blur(20px)',
        backgroundColor: mode === 'dark' 
          ? alpha('#1E2329', 0.95) 
          : alpha('#FFFFFF', 0.95),
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
        {/* Left Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{ 
              display: { md: 'none' },
              color: 'text.primary',
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/dashboard')}
          >
            <School sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              SkillArc LMS
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, ml: 4 }}>
            <Button
              onClick={() => navigate('/dashboard')}
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                px: 2,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                },
              }}
            >
              Dashboard
            </Button>
            <Button
              onClick={() => navigate('/courses')}
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                px: 2,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                },
              }}
            >
              Courses
            </Button>
            <Button
              onClick={() => navigate('/my-courses')}
              sx={{
                color: 'text.primary',
                fontWeight: 600,
                px: 2,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                },
              }}
            >
              My Learning
            </Button>
          </Box>
        </Box>

        {/* Center - Search */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            bgcolor: mode === 'dark' ? '#2B3139' : '#FAFAFA',
            borderRadius: 1,
            px: 2,
            py: 0.5,
            width: '100%',
            maxWidth: 400,
            border: `1px solid ${theme.palette.divider}`,
            '&:focus-within': {
              borderColor: 'primary.main',
              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
            },
          }}
        >
          <Search sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            placeholder="Search courses, assignments..."
            sx={{
              flex: 1,
              color: 'text.primary',
              '& input::placeholder': {
                color: 'text.secondary',
                opacity: 1,
              },
            }}
          />
        </Box>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme Toggle */}
          <IconButton
            onClick={toggleTheme}
            sx={{
              color: 'text.primary',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {/* Notifications */}
          <IconButton
            onClick={handleNotifMenuOpen}
            sx={{
              color: 'text.primary',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Profile */}
          <Button
            onClick={handleProfileMenuOpen}
            sx={{
              ml: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              textTransform: 'none',
              color: 'text.primary',
              bgcolor: alpha(theme.palette.background.elevated, 0.9),
              boxShadow: mode === 'dark'
                ? '0 6px 18px rgba(0,0,0,0.7)'
                : '0 6px 18px rgba(15,23,42,0.12)',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                boxShadow: mode === 'dark'
                  ? '0 10px 26px rgba(0,0,0,0.8)'
                  : '0 10px 26px rgba(15,23,42,0.18)',
              },
            }}
          >
            <Avatar
              src={user?.avatar_url || undefined}
              alt={user?.name || 'User avatar'}
              sx={{
                width: 40,
                height: 40,
                bgcolor: user?.avatar_url ? 'transparent' : 'primary.main',
                color: 'primary.contrastText',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              {!user?.avatar_url && (user?.name?.charAt(0) || 'U')}
            </Avatar>
            <Typography
              variant="body2"
              sx={{
                ml: 1,
                fontWeight: 600,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {user?.name?.split(' ')[0] || 'User'}
            </Typography>
          </Button>
        </Box>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.6)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { navigate('/dashboard'); handleMenuClose(); }}>
          <Dashboard sx={{ mr: 1.5, fontSize: 20 }} />
          Dashboard
        </MenuItem>
        <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
          <AccountCircle sx={{ mr: 1.5, fontSize: 20 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
          <Settings sx={{ mr: 1.5, fontSize: 20 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <Logout sx={{ mr: 1.5, fontSize: 20 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            width: 360,
            maxHeight: 480,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.6)'
              : '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
        </Box>
        <Divider />
        {[
          { title: 'New Assignment Posted', desc: 'React Fundamentals - Due in 3 days', time: '5 min ago' },
          { title: 'Course Update', desc: 'New module added to Web Development', time: '1 hour ago' },
          { title: 'Quiz Graded', desc: 'You scored 95% on JavaScript Quiz', time: '2 hours ago' },
        ].map((notif, index) => (
          <MenuItem key={index} sx={{ py: 1.5, px: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {notif.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {notif.desc}
              </Typography>
              <Typography variant="caption" color="primary.main">
                {notif.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem sx={{ justifyContent: 'center', color: 'primary.main', fontWeight: 600 }}>
          View All Notifications
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default ModernNavbar;
