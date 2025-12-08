import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  CircularProgress,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import { Info, Search, FilterList, Download } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { auditLogsAPI } from '../../services/api';

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

const AuditLogs = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);

  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await auditLogsAPI.getAll(params);
      if (res?.data?.success) {
        const payload = res.data.data;
        setLogs(payload.logs || []);
        setTotal(Number(payload.total) || 0);
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to load audit logs', {
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      enqueueSnackbar('Error loading audit logs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, actionFilter, startDate, endDate]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedLog(null);
    setDetailsOpen(false);
  };

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase();
    return logs.filter((log) => {
      return (
        (log.user_name || '').toLowerCase().includes(q) ||
        (log.user_email || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.target_table || '').toLowerCase().includes(q) ||
        String(log.target_id || '').includes(q) ||
        (log.ip_address || '').toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery]);

  const actionCounts = useMemo(() => {
    const counts = { CREATE: 0, UPDATE: 0, DELETE: 0, LOGIN: 0, LOGOUT: 0 };
    logs.forEach((log) => {
      if (counts[log.action] !== undefined) {
        counts[log.action] += 1;
      }
    });
    return counts;
  }, [logs]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = {
        format: 'csv',
      };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await auditLogsAPI.export(params);
      if (res?.data?.success) {
        const payload = res.data.data || {};
        const csv = payload.csv;
        const filename = payload.filename || 'audit_logs_export.csv';
        if (!csv) {
          enqueueSnackbar('No CSV data returned for export', { variant: 'warning' });
        } else {
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          enqueueSnackbar('Audit logs exported successfully', { variant: 'success' });
        }
      } else {
        enqueueSnackbar('Failed to export audit logs', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      enqueueSnackbar('Failed to export audit logs', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const parseJson = (value) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  };

  const renderKeyValueList = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    return Object.entries(obj).map(([key, val]) => (
      <Box key={key} sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {key}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
        </Typography>
      </Box>
    ));
  };

  return (
    <Box>
      <PageHeader
        title="Audit Logs"
        subtitle="Track all critical actions across the platform"
        breadcrumbs={[
          { label: 'Admin', link: '/dashboard' },
          { label: 'Audit Logs' },
        ]}
      />

      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
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
                placeholder="Search by user, table, action, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  label="Action"
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All actions</MenuItem>
                  <MenuItem value="CREATE">CREATE</MenuItem>
                  <MenuItem value="UPDATE">UPDATE</MenuItem>
                  <MenuItem value="DELETE">DELETE</MenuItem>
                  <MenuItem value="LOGIN">LOGIN</MenuItem>
                  <MenuItem value="LOGOUT">LOGOUT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4} md={2.5}>
              <TextField
                fullWidth
                size="small"
                label="From"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2.5}>
              <TextField
                fullWidth
                size="small"
                label="To"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={1}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Tooltip title="Export CSV">
                  <span>
                    <IconButton
                      onClick={handleExportCsv}
                      disabled={exporting}
                      size="small"
                    >
                      <Download fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>

          {/* Action summary */}
          <Box
            sx={{
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <FilterList sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {total.toLocaleString()} total log entries
            </Typography>
            <Chip
              label={`Create: ${actionCounts.CREATE}`}
              size="small"
              variant="outlined"
              sx={{ ml: 1 }}
            />
            <Chip
              label={`Update: ${actionCounts.UPDATE}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Delete: ${actionCounts.DELETE}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Login: ${actionCounts.LOGIN}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Logout: ${actionCounts.LOGOUT}`}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Logs Table */}
          <TableContainer
            component={Paper}
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
                  <TableCell>Time</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Target ID</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell align="right">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                )}

                {!loading && filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No audit log entries found for the selected filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.log_id}
                      component={motion.tr}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.2 }}
                      hover
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {log.created_at}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {log.user_name || 'System'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.user_email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={log.action}
                          color={
                            log.action === 'CREATE'
                              ? 'success'
                              : log.action === 'UPDATE'
                              ? 'warning'
                              : log.action === 'DELETE'
                              ? 'error'
                              : 'default'
                          }
                          variant={log.action === 'DELETE' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.target_table}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.target_id ?? '-'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {log.ip_address || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View change details">
                          <IconButton size="small" onClick={() => handleOpenDetails(log)}>
                            <Info fontSize="small" />
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
              Showing {filteredLogs.length} of {total.toLocaleString()} logs (page {page + 1})
            </Typography>
            <TablePagination
              component="div"
              count={Number(total) || 0}
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
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    User
                  </Typography>
                  <Typography variant="body2">{selectedLog.user_name || 'System'}</Typography>
                  {selectedLog.user_email && (
                    <Typography variant="caption" color="text.secondary">
                      {selectedLog.user_email}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Metadata
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Action: {selectedLog.action} · Table: {selectedLog.target_table} · ID:{' '}
                    {selectedLog.target_id ?? '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Time: {selectedLog.created_at}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    IP: {selectedLog.ip_address || '-'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Before
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      minHeight: 160,
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.error.light, 0.04)
                          : alpha(theme.palette.error.light, 0.03),
                    }}
                  >
                    {renderKeyValueList(parseJson(selectedLog.old_values)) || (
                      <Typography variant="caption" color="text.secondary">
                        No previous values
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    After
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      minHeight: 160,
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.success.light, 0.04)
                          : alpha(theme.palette.success.light, 0.03),
                    }}
                  >
                    {renderKeyValueList(parseJson(selectedLog.new_values)) || (
                      <Typography variant="caption" color="text.secondary">
                        No new values
                      </Typography>
                    )}
                  </Paper>
                </Grid>
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

export default AuditLogs;
