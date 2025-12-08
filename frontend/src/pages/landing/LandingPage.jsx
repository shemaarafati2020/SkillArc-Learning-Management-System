import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  School,
  TrendingUp,
  EmojiEvents,
  People,
  ArrowForward,
  CheckCircle,
  Star,
  MenuBook,
  Assignment,
  CardMembership,
  Email,
  Twitter,
  Facebook,
  Instagram,
  PlayCircleOutline,
  Speed,
  Verified,
  WorkspacePremium,
  Groups,
  AutoStories,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      number: '1',
      title: 'Browse Courses',
      description: 'Explore our extensive library of courses across various subjects and skill levels',
      icon: <MenuBook />,
      color: '#43a047',
    },
    {
      number: '2',
      title: 'Create An Account',
      description: 'Sign up to start your learning journey and track your progress',
      icon: <People />,
      color: '#3949ab',
    },
    {
      number: '3',
      title: 'Start Learning',
      description: 'Access course materials, complete assignments, and earn certificates',
      icon: <School />,
      color: '#fdd835',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Active Students' },
    { value: '500+', label: 'Expert Instructors' },
    { value: '1,000+', label: 'Quality Courses' },
    { value: '95%', label: 'Success Rate' },
  ];

  const benefits = [
    {
      icon: <TrendingUp />,
      title: 'Track Your Progress',
      description: 'Monitor your learning journey with detailed analytics and progress tracking',
    },
    {
      icon: <EmojiEvents />,
      title: 'Earn Certificates',
      description: 'Get recognized for your achievements with verified certificates',
    },
    {
      icon: <Assignment />,
      title: 'Interactive Learning',
      description: 'Engage with quizzes, assignments, and hands-on projects',
    },
    {
      icon: <People />,
      title: 'Community Support',
      description: 'Connect with peers and instructors through forums and discussions',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Navigation */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backdropFilter: 'blur(20px)',
          bgcolor: alpha(theme.palette.background.paper, 0.9),
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.1),
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 2.5,
            }}
          >
            {/* Logo */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
              onClick={() => navigate('/')}
            >
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #1e88e5 0%, #3949ab 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(30, 136, 229, 0.4)',
                }}
              >
                <School sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 900, 
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #1e88e5 0%, #3949ab 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                SkillArc LMS
              </Typography>
            </Box>

            {/* Open Dashboard Button */}
            <Button
              variant="contained"
              onClick={() => navigate('/login')}
              endIcon={<ArrowForward />}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                fontSize: { xs: '1rem', md: '1.1rem' },
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1e88e5 0%, #3949ab 100%)',
                boxShadow: '0 8px 25px rgba(30, 136, 229, 0.5)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #283593 100%)',
                  boxShadow: '0 12px 35px rgba(30, 136, 229, 0.7)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Open Dashboard
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
        }}
      >
        {/* Animated Background Elements */}
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          }}
        />
        <Box
          component={motion.div}
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          sx={{
            position: 'absolute',
            bottom: '-10%',
            left: '-5%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '2.4rem', md: '3.2rem', lg: '3.8rem' },
                    mb: 3,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.15,
                  }}
                >
                  Master New Skills,
                  <br />
                  Shape Your Future
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.95,
                    fontWeight: 400,
                    fontSize: { xs: '1.3rem', md: '1.6rem' },
                  }}
                >
                  SkillArc LMS - Your gateway to world-class education. Learn from industry experts, earn recognized certificates, and accelerate your career growth.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    endIcon={<ArrowForward />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      borderRadius: 3,
                      bgcolor: 'white',
                      color: '#2e7d32',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Get Started Free
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      borderRadius: 3,
                      borderColor: 'white',
                      color: 'white',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderColor: 'white',
                      },
                    }}
                  >
                    Sign In
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, mt: 4, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Avatar
                        key={i}
                        sx={{
                          width: 40,
                          height: 40,
                          border: '2px solid white',
                          ml: i > 1 ? -1.5 : 0,
                          bgcolor: `hsl(${i * 60}, 70%, 60%)`,
                        }}
                      >
                        {String.fromCharCode(64 + i)}
                      </Avatar>
                    ))}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Trusted by over 10,000 students worldwide
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                    alt="Students learning"
                    sx={{
                      width: '100%',
                      maxWidth: 500,
                      borderRadius: 4,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: '2.2rem', md: '2.8rem' },
                      background: 'linear-gradient(135deg, #fdd835 0%, #fbc02d 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How To Get Started Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 10 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              textAlign: 'center',
              mb: 5,
              fontSize: { xs: '2.2rem', md: '2.8rem' },
            }}
          >
            How To Get Started
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      border: '2px solid',
                      borderColor: index === 0 ? feature.color : 'divider',
                      bgcolor: index === 0 ? alpha(feature.color, 0.05) : 'background.paper',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 12px 40px ${alpha(feature.color, 0.2)}`,
                        borderColor: feature.color,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          bgcolor: feature.color,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1.5rem',
                          mb: 3,
                        }}
                      >
                        {feature.number}
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {feature.description}
                      </Typography>
                      {index === 0 && (
                        <Button
                          variant="contained"
                          onClick={() => navigate('/register')}
                          sx={{
                            mt: 3,
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: feature.color,
                            borderRadius: 2,
                            '&:hover': {
                              bgcolor: alpha(feature.color, 0.8),
                            },
                          }}
                        >
                          Get Started
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            textAlign: 'center',
            mb: 2,
            fontSize: { xs: '2.2rem', md: '2.8rem' },
          }}
        >
          Why People Trust Us
        </Typography>
        <Typography
          variant="h6"
          sx={{
            textAlign: 'center',
            mb: 6,
            color: 'text.secondary',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          Join a community of learners who trust our platform for quality education and career growth
        </Typography>
        <Grid container spacing={4}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'primary.main',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {benefit.icon}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {benefit.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benefit.description}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Advanced Features Showcase */}
      <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), py: 10 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              textAlign: 'center',
              mb: 2,
              fontSize: { xs: '2.2rem', md: '2.8rem' },
            }}
          >
            Everything You Need to Succeed
          </Typography>
          <Typography
            variant="h6"
            sx={{
              textAlign: 'center',
              mb: 6,
              color: 'text.secondary',
              maxWidth: 700,
              mx: 'auto',
            }}
          >
            SkillArc LMS provides a complete learning ecosystem with cutting-edge features
          </Typography>
          <Grid container spacing={3}>
            {[
              {
                icon: <PlayCircleOutline sx={{ fontSize: 40 }} />,
                title: 'Video Lectures',
                description: 'HD video content with subtitles and playback controls',
                color: '#43a047',
              },
              {
                icon: <Speed sx={{ fontSize: 40 }} />,
                title: 'Fast Learning',
                description: 'Self-paced courses that fit your schedule',
                color: '#78909c',
              },
              {
                icon: <Verified sx={{ fontSize: 40 }} />,
                title: 'Verified Certificates',
                description: 'Industry-recognized credentials upon completion',
                color: '#fdd835',
              },
              {
                icon: <WorkspacePremium sx={{ fontSize: 40 }} />,
                title: 'Expert Instructors',
                description: 'Learn from industry professionals and academics',
                color: '#3949ab',
              },
              {
                icon: <Groups sx={{ fontSize: 40 }} />,
                title: 'Community Forums',
                description: 'Connect with peers and get instant help',
                color: '#66bb6a',
              },
              {
                icon: <AutoStories sx={{ fontSize: 40 }} />,
                title: 'Rich Resources',
                description: 'Downloadable materials, quizzes, and assignments',
                color: '#ffb300',
              },
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 12px 40px ${alpha(feature.color, 0.2)}`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: 3,
                          bgcolor: alpha(feature.color, 0.1),
                          color: feature.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #78909c 0%, #546e7a 100%)',
          color: 'white',
          py: 10,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                mb: 3,
                fontSize: { xs: '2rem', md: '2.6rem' },
              }}
            >
              Ready To Start Learning?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
              Join thousands of students already learning on SkillArc LMS
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                endIcon={<ArrowForward />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 5,
                  py: 2,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  bgcolor: 'white',
                  color: '#667eea',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  },
                }}
              >
                Create Free Account
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 5,
                  py: 2,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  borderColor: 'white',
                  color: 'white',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #3949ab 0%, #283593 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mb: 3,
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
                onClick={() => navigate('/')}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 3,
                    bgcolor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  <School sx={{ fontSize: 36, color: '#3949ab' }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}>
                  SkillArc LMS
                </Typography>
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Typography variant="h6" sx={{ mb: 5, opacity: 0.95, maxWidth: 600, fontWeight: 400 }}>
                Empowering learners worldwide with quality education and expert-led courses.
              </Typography>
            </motion.div>

            {/* Connect With Us Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, fontSize: { xs: '1.3rem', md: '1.5rem' } }}>
                Connect With Us
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mb: 5 }}>
                {/* Email */}
                <Box
                  component="a"
                  href="mailto:shemaarafati26@gmail.com"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.25)',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  <Email sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Email</Typography>
                </Box>
                {/* Facebook */}
                <Box
                  component="a"
                  href="https://web.facebook.com/profile.php?id=61570535879647"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      bgcolor: '#1877F2',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(24, 119, 242, 0.4)',
                    },
                  }}
                >
                  <Facebook sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Facebook</Typography>
                </Box>
                {/* Twitter/X */}
                <Box
                  component="a"
                  href="https://x.com/cryptoVOIDDROP"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      bgcolor: '#000000',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
                    },
                  }}
                >
                  <Twitter sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Twitter</Typography>
                </Box>
                {/* Instagram */}
                <Box
                  component="a"
                  href="https://www.instagram.com/iam_arafati26/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(240, 148, 51, 0.4)',
                    },
                  }}
                >
                  <Instagram sx={{ fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Instagram</Typography>
                </Box>
              </Box>
            </motion.div>

            {/* Copyright */}
            <Box 
              sx={{ 
                borderTop: '1px solid rgba(255,255,255,0.2)', 
                pt: 4, 
                width: '100%',
              }}
            >
              <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                © 2025 SkillArc LMS. All rights reserved. | Made with ❤️ for learners worldwide
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
