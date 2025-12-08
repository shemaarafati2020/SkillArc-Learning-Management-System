import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography, Card, CardContent, Chip, Stack } from '@mui/material';
import { School, EmojiEvents, AutoStories } from '@mui/icons-material';
import { motion } from 'framer-motion';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at top left, rgba(67,160,71,0.3), transparent 60%), radial-gradient(circle at bottom right, rgba(253,216,53,0.3), transparent 60%), linear-gradient(135deg, #1e88e5 0%, #283593 60%)',
        py: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background artifacts */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {[
          {
            bg: 'radial-gradient(circle, rgba(67,160,71,0.45) 0%, transparent 60%)',
            left: '-10%',
            top: '5%',
            size: 260,
            rounded: '50%',
          },
          {
            bg: 'radial-gradient(circle, rgba(253,216,53,0.4) 0%, transparent 60%)',
            left: '65%',
            top: '-12%',
            size: 220,
            rounded: '40%',
          },
          {
            bg: 'radial-gradient(circle, rgba(57,73,171,0.45) 0%, transparent 60%)',
            left: '5%',
            top: '70%',
            size: 230,
            rounded: '32px',
          },
          {
            bg: 'radial-gradient(circle, rgba(120,144,156,0.5) 0%, transparent 60%)',
            left: '75%',
            top: '65%',
            size: 200,
            rounded: '999px',
          },
        ].map((shape, index) => (
          <motion.div
            key={index}
            style={{
              position: 'absolute',
              width: shape.size,
              height: shape.size,
              borderRadius: shape.rounded,
              background: shape.bg,
              left: shape.left,
              top: shape.top,
            }}
            animate={{
              y: [0, index % 2 === 0 ? -18 : 18, 0],
              x: [0, index % 2 === 0 ? 12 : -12, 0],
              scale: [1, 1.06, 1],
              opacity: [0.5, 0.9, 0.5],
            }}
            transition={{
              duration: 12 + index * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </Box>

      {/* Left side feature card */}
      <Box
        sx={{
          position: 'absolute',
          left: { xs: '-9999px', md: '4%' },
          top: '50%',
          transform: 'translateY(-50%)',
          display: { xs: 'none', md: 'block' },
          zIndex: 1,
        }}
      >
        <Box
          component={motion.div}
          whileHover={{ y: -8, rotate: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 140, damping: 12 }}
        >
          <Card
            sx={{
              width: 260,
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 10px 30px rgba(15,23,42,0.35)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box
              component="img"
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80"
              alt="Students collaborating"
              sx={{ width: '100%', height: 120, objectFit: 'cover' }}
            />
            <CardContent sx={{ p: 2.2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <EmojiEvents sx={{ fontSize: 20, color: '#fdd835' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Learn. Achieve. Grow.
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Track your progress, unlock achievements, and stay motivated every day.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label="Progress" size="small" sx={{ bgcolor: 'rgba(67,160,71,0.08)', color: '#2e7d32' }} />
                <Chip label="Achievements" size="small" sx={{ bgcolor: 'rgba(57,73,171,0.08)', color: '#3949ab' }} />
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Right side feature card */}
      <Box
        sx={{
          position: 'absolute',
          right: { xs: '-9999px', md: '4%' },
          top: '50%',
          transform: 'translateY(-50%)',
          display: { xs: 'none', md: 'block' },
          zIndex: 1,
        }}
      >
        <Box
          component={motion.div}
          whileHover={{ y: -8, rotate: 1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 140, damping: 12 }}
        >
          <Card
            sx={{
              width: 260,
              borderRadius: 3,
              overflow: 'hidden',
              bgcolor: 'rgba(15,23,42,0.92)',
              color: 'white',
              boxShadow: '0 10px 30px rgba(15,23,42,0.6)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CardContent sx={{ p: 2.4 }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <AutoStories sx={{ fontSize: 22, color: '#fdd835' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Learn Anytime
                </Typography>
              </Stack>

              {/* Top pills: stats + reliability */}
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1.5 }}
              >
                <Box
                  sx={{
                    px: 1.6,
                    py: 0.7,
                    borderRadius: 999,
                    bgcolor: 'rgba(15,23,42,0.85)',
                    border: '1px solid rgba(148,163,184,0.5)',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.7)',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #43a047 0%, #fdd835 50%, #3949ab 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    10k+ learners • 1k+ courses
                  </Typography>
                </Box>

                <Box
                  sx={{
                    px: 1.4,
                    py: 0.7,
                    borderRadius: 999,
                    bgcolor: 'rgba(67,160,71,0.2)',
                    border: '1px solid rgba(129,199,132,0.7)',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#e8f5e9' }}>
                    24/7 secure access
                  </Typography>
                </Box>
              </Stack>

              <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.9 }}>
                Bite-sized lessons and rich resources so you can study on your own schedule.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label="Quizzes"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(120,144,156,0.25)',
                    color: 'white',
                    borderRadius: 999,
                  }}
                />
                <Chip
                  label="Certificates"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(67,160,71,0.25)',
                    color: 'white',
                    borderRadius: 999,
                  }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <School sx={{ fontSize: 64, color: 'white', mb: 2 }} />
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
            SkillArc LMS
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Modern Learning Management System
          </Typography>
        </Box>
        
        <Paper elevation={24} sx={{ p: 4, borderRadius: 2 }}>
          <Outlet />
        </Paper>
        
        <Typography
          variant="body2"
          sx={{ textAlign: 'center', mt: 3, color: 'rgba(255,255,255,0.8)' }}
        >
          © {new Date().getFullYear()} SkillArc LMS. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default AuthLayout;
