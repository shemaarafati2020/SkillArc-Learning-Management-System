import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Stack,
  LinearProgress,
  Chip,
  Grid,
  Paper,
  Divider,
  alpha,
} from '@mui/material';
import { Upload, Email, Person, Badge, CalendarToday, PhotoCamera } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `http://localhost${avatarUrl}`;
};

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      const res = await authAPI.uploadAvatar(formData);
      if (res?.data?.success) {
        enqueueSnackbar('Profile picture updated', { variant: 'success' });
        await refreshUser();
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to upload avatar', {
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      enqueueSnackbar('Error uploading avatar', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#1e88e5';
      case 'instructor':
        return '#43a047';
      case 'student':
        return '#fdd835';
      default:
        return '#78909c';
    }
  };

  return (
    <Box>
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and profile picture"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Profile' },
        ]}
      />

      <Grid container spacing={3}>
        {/* Profile Picture Card */}
        <Grid item xs={12} md={4}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.9)
                  : 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 100%)',
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  src={getAvatarUrl(user?.avatar_url)}
                  alt={user?.name || 'User avatar'}
                  sx={{
                    width: 140,
                    height: 140,
                    fontSize: '3rem',
                    bgcolor: user?.avatar_url ? 'transparent' : getRoleColor(user?.role),
                    color: 'white',
                    boxShadow: '0 14px 30px rgba(0,0,0,0.25)',
                    border: '4px solid',
                    borderColor: 'background.paper',
                  }}
                >
                  {!user?.avatar_url && (user?.name?.charAt(0)?.toUpperCase() || 'U')}
                </Avatar>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: getRoleColor(user?.role),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    border: '3px solid',
                    borderColor: 'background.paper',
                  }}
                >
                  <PhotoCamera sx={{ fontSize: 20, color: 'white' }} />
                </Box>
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                {user?.name || 'User'}
              </Typography>
              
              <Chip
                label={user?.role?.toUpperCase() || 'USER'}
                size="small"
                sx={{
                  mb: 3,
                  bgcolor: alpha(getRoleColor(user?.role), 0.15),
                  color: getRoleColor(user?.role),
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />

              <Button
                fullWidth
                variant="contained"
                component="label"
                startIcon={<Upload />}
                disabled={uploading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.2,
                  background: `linear-gradient(135deg, ${getRoleColor(user?.role)} 0%, ${alpha(getRoleColor(user?.role), 0.8)} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(getRoleColor(user?.role), 0.9)} 0%, ${alpha(getRoleColor(user?.role), 0.7)} 100%)`,
                  },
                }}
              >
                Change Profile Picture
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarChange}
                />
              </Button>
              
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Recommended: square image, max 5MB
              </Typography>
              
              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Uploading...
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Information Card */}
        <Grid item xs={12} md={8}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.9)
                  : 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
              boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: 3,
                  background: `linear-gradient(135deg, ${getRoleColor(user?.role)} 0%, ${alpha(getRoleColor(user?.role), 0.7)} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Profile Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.5)
                          : alpha('#e3f2fd', 0.3),
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha('#1e88e5', 0.1),
                        }}
                      >
                        <Person sx={{ color: '#1e88e5', fontSize: 28 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Full Name
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {user?.name || 'Not set'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.5)
                          : alpha('#e8f5e9', 0.3),
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha('#43a047', 0.1),
                        }}
                      >
                        <Email sx={{ color: '#43a047', fontSize: 28 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Email Address
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {user?.email || 'Not set'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.5)
                          : alpha('#fff9c4', 0.3),
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha('#fdd835', 0.1),
                        }}
                      >
                        <Badge sx={{ color: '#f57f17', fontSize: 28 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Role
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
                          {user?.role || 'Not set'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.5)
                          : alpha('#f3e5f5', 0.3),
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha('#7b1fa2', 0.1),
                        }}
                      >
                        <CalendarToday sx={{ color: '#7b1fa2', fontSize: 24 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Member Since
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Need to update your information? Contact your administrator.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
