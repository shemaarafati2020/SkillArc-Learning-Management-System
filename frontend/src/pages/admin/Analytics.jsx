import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  useTheme,
  alpha,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp,
  PeopleAlt,
  School,
  AutoGraph,
  WorkspacePremium,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PageHeader from '../../components/common/PageHeader';
import { analyticsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const KpiCard = ({ icon, title, value, helper, color }) => {
  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) =>
                alpha(color || theme.palette.primary.main, 0.12),
              color: color || 'primary.main',
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {Number.isFinite(value) ? value.toLocaleString() : value}
            </Typography>
            {helper && (
              <Typography variant="caption" color="text.secondary">
                {helper}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const AnimatedBar = ({ label, value, max, color }) => {
  const height = max > 0 ? (value / max) * 100 : 0;
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.5,
        minWidth: 40,
      }}
    >
      <Box
        component={motion.div}
        initial={{ height: 0 }}
        animate={{ height: `${height}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        sx={{
          width: 18,
          borderRadius: 999,
          background: color,
          originY: 1,
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
};

const Analytics = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [trend12, setTrend12] = useState([]);
  const [completionRates, setCompletionRates] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [dashboardRes, trendRes, completionRes] = await Promise.all([
          analyticsAPI.getDashboard(),
          analyticsAPI.getEnrollmentTrends(),
          analyticsAPI.getCompletionRates(),
        ]);

        if (dashboardRes?.data?.success) {
          setStats(dashboardRes.data.data);
        }

        if (trendRes?.data?.success) {
          setTrend12(trendRes.data.data || []);
        }

        if (completionRes?.data?.success) {
          const completionData = completionRes.data.data;
          setCompletionRates(Array.isArray(completionData) ? completionData : []);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
        enqueueSnackbar('Failed to load analytics data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [enqueueSnackbar]);

  const enrollmentTrend = stats?.enrollment_trend || [];
  const completionTrend = stats?.completion_trend || [];
  const recentEnrollments = stats?.recent_enrollments || [];
  const recentCompletions = stats?.recent_completions || [];

  const totalUsers = stats?.users || 0;
  const totalStudents = stats?.students || 0;
  const totalInstructors = stats?.instructors || 0;
  const totalCourses = stats?.courses || 0;
  const publishedCourses = stats?.published_courses || 0;
  const totalEnrollments = stats?.enrollments || 0;
  const activeEnrollments = stats?.active_enrollments || 0;
  const completedEnrollments = stats?.completed_enrollments || 0;
  const certificates = stats?.certificates || 0;
  const submissions = stats?.submissions || 0;
  const quizAttempts = stats?.quiz_attempts || 0;

  const completionRate = totalEnrollments
    ? Math.round((completedEnrollments / totalEnrollments) * 100)
    : 0;
  const publishRate = totalCourses
    ? Math.round((publishedCourses / totalCourses) * 100)
    : 0;
  const certificationRate = completedEnrollments
    ? Math.round((certificates / completedEnrollments) * 100)
    : 0;

  const maxEnroll = Math.max(
    1,
    ...enrollmentTrend.map((e) => Number(e.count) || 0),
    ...completionTrend.map((e) => Number(e.count) || 0)
  );

  const enrollmentTrend12 = Array.isArray(trend12) ? trend12 : [];
  const maxEnroll12 = Math.max(
    1,
    ...enrollmentTrend12.map((e) => Number(e.count) || 0)
  );

  return (
    <Box>
      <PageHeader title="Analytics" subtitle="System performance and insights" />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && stats && (
        <Grid container spacing={3}>
          {/* KPI Row */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  icon={<PeopleAlt fontSize="small" />}
                  title="Total Users"
                  value={totalUsers}
                  helper={`${totalStudents.toLocaleString()} students · ${totalInstructors.toLocaleString()} instructors`}
                  color="#1e88e5" // indigo
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  icon={<School fontSize="small" />}
                  title="Courses"
                  value={totalCourses}
                  helper={`${publishedCourses.toLocaleString()} published · ${publishRate}% publish rate`}
                  color="#43a047" // green
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  icon={<AutoGraph fontSize="small" />}
                  title="Enrollments"
                  value={totalEnrollments}
                  helper={`${completedEnrollments.toLocaleString()} completed · ${completionRate}% completion`}
                  color="#fdd835" // yellow
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  icon={<WorkspacePremium fontSize="small" />}
                  title="Engagement"
                  value={certificates}
                  helper={`${quizAttempts.toLocaleString()} quiz attempts · ${submissions.toLocaleString()} submissions`}
                  color="#78909c" // gray
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Trends + Recent Activity */}
          <Grid item xs={12} md={8}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <TrendingUp sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Enrollments & Completions (Last 6 Months)
                  </Typography>
                  <Chip
                    size="small"
                    label="Monthly"
                    sx={{ ml: 'auto' }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 2,
                    height: 220,
                    p: 2,
                    borderRadius: 3,
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.9)
                        : alpha(theme.palette.primary.light, 0.1),
                  }}
                >
                  {enrollmentTrend.length === 0 && completionTrend.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No trend data available yet.
                    </Typography>
                  )}

                  {enrollmentTrend.map((item) => (
                    <AnimatedBar
                      key={`enroll-${item.month}`}
                      label={item.month}
                      value={Number(item.count) || 0}
                      max={maxEnroll}
                      color={theme.palette.primary.main}
                    />
                  ))}

                  {completionTrend.map((item) => (
                    <AnimatedBar
                      key={`complete-${item.month}`}
                      label={item.month}
                      value={Number(item.count) || 0}
                      max={maxEnroll}
                      color={theme.palette.success.main}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Recent Activity (7 days)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Daily enrollments and completions
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Enrollments
                    </Typography>
                    <Stack spacing={0.5}>
                      {recentEnrollments.slice(-5).map((item) => (
                        <Box key={item.date} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            {item.date}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {item.count}
                          </Typography>
                        </Box>
                      ))}
                      {recentEnrollments.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          No recent enrollments
                        </Typography>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Completions
                    </Typography>
                    <Stack spacing={0.5}>
                      {recentCompletions.slice(-5).map((item) => (
                        <Box key={item.date} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="text.secondary">
                            {item.date}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {item.count}
                          </Typography>
                        </Box>
                      ))}
                      {recentCompletions.length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          No recent completions
                        </Typography>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 12-month trend and top courses */}
          <Grid item xs={12} md={7}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <AutoGraph sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Enrollment Trend (Last 12 Months)
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 1.5,
                    height: 200,
                    p: 2,
                    borderRadius: 3,
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.9)
                        : alpha(theme.palette.secondary.light, 0.1),
                  }}
                >
                  {enrollmentTrend12.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No enrollment trend data yet.
                    </Typography>
                  )}

                  {enrollmentTrend12.map((item) => (
                    <AnimatedBar
                      key={`trend12-${item.month}`}
                      label={item.month}
                      value={Number(item.count) || 0}
                      max={maxEnroll12}
                      color={theme.palette.primary.main}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Top Courses by Completion Rate
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Published courses only · Top 10
                </Typography>
                <Divider sx={{ my: 2 }} />

                {completionRates.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No completion data available yet.
                  </Typography>
                )}

                <Stack spacing={1.2}>
                  {Array.isArray(completionRates) && completionRates.map((course, index) => {
                    const rate = Number(course.completion_rate) || 0;
                    const total = Number(course.total_enrolled) || 0;
                    return (
                      <Box key={course.course_id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              maxWidth: '70%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {index + 1}. {course.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rate}%
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            position: 'relative',
                            height: 8,
                            borderRadius: 999,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            component={motion.div}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(rate, 100)}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              width: `${Math.min(rate, 100)}%`,
                              bgcolor: theme.palette.success.main,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {total.toLocaleString()} enrolled
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default Analytics;
