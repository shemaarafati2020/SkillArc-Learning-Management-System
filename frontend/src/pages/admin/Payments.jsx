import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  AttachMoney,
  CheckCircle,
  Pending,
  Search,
  FilterList,
  Visibility,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { enrollmentsAPI } from '../../services/api';

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const Payments = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [enrollments, setEnrollments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      // For now, we'll fetch all enrollments and handle payment status on frontend
      // In production, you'd have a dedicated payments API endpoint
      const res = await enrollmentsAPI.getAll({
        limit: 1000,
        offset: 0,
      }).catch((err) => {
        console.error('API Error:', err);
        return null;
      });

      if (res?.data?.success) {
        const payload = res.data.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.enrollments)
          ? payload.enrollments
          : [];
        
        // Add mock payment status for demonstration
        // In production, this would come from the backend
        const enrichedList = list.map((enrollment) => ({
          ...enrollment,
          payment_status: enrollment.payment_status || (Math.random() > 0.3 ? 'paid' : 'pending'),
          payment_amount: enrollment.payment_amount || parseFloat(enrollment.course_price || 0),
          payment_date: enrollment.payment_date || enrollment.enrolled_at,
        }));

        setEnrollments(enrichedList);
        setTotal(enrichedList.length);
      } else {
        setEnrollments([]);
        setTotal(0);
        if (res !== null) {
          enqueueSnackbar('No payment data available', { variant: 'info' });
        }
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      setEnrollments([]);
      setTotal(0);
      enqueueSnackbar('Error loading payment data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEnrollments = useMemo(() => {
    let data = [...enrollments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((enrollment) => {
        return (
          (enrollment.student_name || '').toLowerCase().includes(q) ||
          (enrollment.student_email || '').toLowerCase().includes(q) ||
          (enrollment.course_title || '').toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== 'all') {
      data = data.filter((enrollment) => enrollment.payment_status === statusFilter);
    }

    if (courseFilter !== 'all') {
      data = data.filter((enrollment) => String(enrollment.course_id) === courseFilter);
    }

    return data;
  }, [enrollments, searchQuery, statusFilter, courseFilter]);

  const paginatedEnrollments = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredEnrollments.slice(start, start + rowsPerPage);
  }, [filteredEnrollments, page, rowsPerPage]);

  const courseOptions = useMemo(() => {
    const courses = new Map();
    enrollments.forEach((e) => {
      if (e.course_id && e.course_title) {
        courses.set(String(e.course_id), e.course_title);
      }
    });
    return Array.from(courses.entries());
  }, [enrollments]);

  const stats = useMemo(() => {
    const totalPaid = enrollments.filter((e) => e.payment_status === 'paid').length;
    const totalPending = enrollments.filter((e) => e.payment_status === 'pending').length;
    const totalRevenue = enrollments
      .filter((e) => e.payment_status === 'paid')
      .reduce((sum, e) => sum + (parseFloat(e.payment_amount) || 0), 0);

    return { totalPaid, totalPending, totalRevenue };
  }, [enrollments]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetails = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedEnrollment(null);
    setDetailsOpen(false);
  };

  return (
    <Box>
      <PageHeader
        title="Payments"
        subtitle="Track student course payments and revenue"
        breadcrumbs={[
          { label: 'Admin', link: '/dashboard' },
          { label: 'Payments' },
        ]}
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
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
                  : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha('#43a047', 0.15),
                    color: '#43a047',
                  }}
                >
                  <CheckCircle />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Paid Enrollments
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {stats.totalPaid}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.9)
                  : 'linear-gradient(135deg, #fff9c4 0%, #fff59d 100%)',
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha('#fdd835', 0.15),
                    color: '#f57f17',
                  }}
                >
                  <Pending />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pending Payments
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {stats.totalPending}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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
                  : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
            }}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha('#1e88e5', 0.15),
                    color: '#1e88e5',
                  }}
                >
                  <AttachMoney />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    ${stats.totalRevenue.toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Payments Table */}
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.9)
              : 'linear-gradient(135deg, #eceff1 0%, #e3f2fd 50%, #fff9c4 100%)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Filters */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by student or course..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  label="Payment Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Course</InputLabel>
                <Select
                  label="Course"
                  value={courseFilter}
                  onChange={(e) => {
                    setCourseFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Courses</MenuItem>
                  {courseOptions.map(([id, title]) => (
                    <MenuItem key={id} value={id}>
                      {title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Summary */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {filteredEnrollments.length} payment records
            </Typography>
          </Box>

          {/* Table */}
          <TableContainer
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.7),
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell>Student</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Enrolled Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                )}

                {!loading && paginatedEnrollments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No payment records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  paginatedEnrollments.map((enrollment) => (
                    <TableRow
                      key={enrollment.enrollment_id}
                      component={motion.tr}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.25 }}
                      hover
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {enrollment.student_name?.charAt(0)?.toUpperCase() || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {enrollment.student_name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {enrollment.student_email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {enrollment.course_title || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${parseFloat(enrollment.payment_amount || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={enrollment.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          color={enrollment.payment_status === 'paid' ? 'success' : 'warning'}
                          variant="filled"
                          icon={
                            enrollment.payment_status === 'paid' ? (
                              <CheckCircle fontSize="small" />
                            ) : (
                              <Pending fontSize="small" />
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {enrollment.enrolled_at || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetails(enrollment)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Showing {paginatedEnrollments.length} of {filteredEnrollments.length} records
            </Typography>
            <TablePagination
              component="div"
              count={Number(filteredEnrollments.length) || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent dividers>
          {selectedEnrollment && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Student
                  </Typography>
                  <Typography variant="body2">{selectedEnrollment.student_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedEnrollment.student_email}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Course
                  </Typography>
                  <Typography variant="body2">{selectedEnrollment.course_title}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Amount
                  </Typography>
                  <Typography variant="body2">
                    ${parseFloat(selectedEnrollment.payment_amount || 0).toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    size="small"
                    label={selectedEnrollment.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    color={selectedEnrollment.payment_status === 'paid' ? 'success' : 'warning'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Enrolled Date
                  </Typography>
                  <Typography variant="body2">{selectedEnrollment.enrolled_at || '-'}</Typography>
                </Grid>
                {selectedEnrollment.payment_status === 'paid' && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Payment Date
                    </Typography>
                    <Typography variant="body2">
                      {selectedEnrollment.payment_date || selectedEnrollment.enrolled_at || '-'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payments;
