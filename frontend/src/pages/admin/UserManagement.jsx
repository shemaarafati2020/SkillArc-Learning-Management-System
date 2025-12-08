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
  Switch,
  FormControlLabel,
  Checkbox,
  useTheme,
  alpha,
} from '@mui/material';
import { People, Add, Edit, Delete, CheckCircle, Block } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const defaultForm = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  institution: '',
  is_active: true,
};

const UserManagement = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  const fetchParams = useMemo(() => {
    const params = {
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    };
    if (search.trim()) params.search = search.trim();
    if (roleFilter !== 'all') params.role = roleFilter;
    if (statusFilter === 'active') params.is_active = 1;
    if (statusFilter === 'inactive') params.is_active = 0;
    return params;
  }, [rowsPerPage, page, search, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll(fetchParams);
      const payload = res?.data?.data;
      if (res?.data?.success && payload) {
        setUsers(payload.users || []);
        setTotal(Number(payload.total) || 0);
      } else {
        enqueueSnackbar('Failed to load users', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      enqueueSnackbar('Error fetching users', { variant: 'error' });
    } finally {
      setLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchParams]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'student',
      institution: user.institution || '',
      is_active: Boolean(user.is_active),
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setForm(defaultForm);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveUser = async () => {
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        institution: form.institution.trim() || null,
        is_active: form.is_active ? 1 : 0,
      };

      if (!editingUser) {
        // Create - require password
        if (!form.password || form.password.length < 8) {
          enqueueSnackbar('Password must be at least 8 characters', { variant: 'warning' });
          return;
        }
        payload.password = form.password;
      }

      if (!payload.name || !payload.email) {
        enqueueSnackbar('Name and email are required', { variant: 'warning' });
        return;
      }

      if (editingUser) {
        const res = await usersAPI.update(editingUser.user_id, payload);
        if (res?.data?.success) {
          enqueueSnackbar('User updated successfully', { variant: 'success' });
          handleCloseDialog();
          loadUsers();
        } else {
          enqueueSnackbar(res?.data?.message || 'Failed to update user', { variant: 'error' });
        }
      } else {
        const res = await usersAPI.create(payload);
        if (res?.data?.success) {
          enqueueSnackbar('User created successfully', { variant: 'success' });
          handleCloseDialog();
          setPage(0);
          loadUsers();
        } else {
          enqueueSnackbar(res?.data?.message || 'Failed to create user', { variant: 'error' });
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      enqueueSnackbar('Error saving user', { variant: 'error' });
    }
  };

  const handleOpenDelete = (user) => {
    setSelectedUserForDelete(user);
    setDeleteDialogOpen(true);
    setBulkDelete(false);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedUserForDelete(null);
    setDeleteDialogOpen(false);
    setBulkDelete(false);
  };

  const handleConfirmDelete = async () => {
    try {
      if (bulkDelete) {
        const idsToDelete = selectedIds.filter((id) => id !== currentUser?.user_id);
        if (idsToDelete.length === 0) {
          enqueueSnackbar('No valid users selected to delete', { variant: 'warning' });
          handleCloseDeleteDialog();
          return;
        }

        await Promise.all(
          idsToDelete.map((id) =>
            usersAPI.delete(id).catch((error) => {
              console.error('Error deleting user id', id, error);
              return null;
            })
          )
        );

        enqueueSnackbar('Selected users deleted', { variant: 'success' });
        setSelectedIds([]);
        handleCloseDeleteDialog();
        loadUsers();
      } else {
        if (!selectedUserForDelete) return;
        const res = await usersAPI.delete(selectedUserForDelete.user_id);
        if (res?.data?.success) {
          enqueueSnackbar('User deleted successfully', { variant: 'success' });
          handleCloseDeleteDialog();
          loadUsers();
        } else {
          enqueueSnackbar(res?.data?.message || 'Failed to delete user', { variant: 'error' });
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      enqueueSnackbar('Error deleting user', { variant: 'error' });
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const res = await usersAPI.update(user.user_id, { is_active: user.is_active ? 0 : 1 });
      if (res?.data?.success) {
        enqueueSnackbar(
          user.is_active ? 'User deactivated' : 'User activated',
          { variant: 'success' }
        );
        loadUsers();
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to update status', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      enqueueSnackbar('Error updating status', { variant: 'error' });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id) => selectedIds.includes(id);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const allIds = users.map((u) => u.user_id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleRowSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (makeActive) => {
    const ids = selectedIds.filter((id) => id !== currentUser?.user_id);
    if (!ids.length) {
      enqueueSnackbar('No valid users selected', { variant: 'warning' });
      return;
    }

    try {
      await Promise.all(
        ids.map((id) =>
          usersAPI.update(id, { is_active: makeActive ? 1 : 0 }).catch((error) => {
            console.error('Error updating user id', id, error);
            return null;
          })
        )
      );

      enqueueSnackbar(
        makeActive ? 'Selected users activated' : 'Selected users deactivated',
        { variant: 'success' }
      );
      setSelectedIds([]);
      loadUsers();
    } catch (error) {
      console.error('Error updating users:', error);
      enqueueSnackbar('Error updating selected users', { variant: 'error' });
    }
  };

  const handleBulkActivate = () => handleBulkStatusChange(true);

  const handleBulkDeactivate = () => handleBulkStatusChange(false);

  const handleBulkDelete = () => {
    if (!selectedIds.length) {
      enqueueSnackbar('No users selected', { variant: 'warning' });
      return;
    }
    setBulkDelete(true);
    setDeleteDialogOpen(true);
  };

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="Manage all users in the platform"
        actionText="Add User"
        actionIcon={<Add />}
        onAction={handleOpenAdd}
        breadcrumbs={[
          { label: 'Admin', link: '/dashboard' },
          { label: 'User Management' },
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
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.15)',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.9)
              : 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 60%, #fff9c4 100%)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search by name or email"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="instructor">Instructor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Bulk actions toolbar */}
          {selectedIds.length > 0 && (
            <Box
              sx={{
                mb: 1.5,
                px: 0.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedIds.length} selected
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBulkActivate}
                >
                  Activate
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleBulkDeactivate}
                >
                  Deactivate
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  onClick={handleBulkDelete}
                >
                  Delete
                </Button>
              </Stack>
            </Box>
          )}

          {/* Users Table */}
          <TableContainer
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.6),
              overflow: 'hidden',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedIds.length > 0 && selectedIds.length < users.length
                      }
                      checked={users.length > 0 && selectedIds.length === users.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'select all users' }}
                    />
                  </TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.user_id}
                    component={motion.tr}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.25 }}
                    hover
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isSelected(u.user_id)}
                        onChange={() => handleRowSelect(u.user_id)}
                        inputProps={{ 'aria-label': `select user ${u.user_id}` }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {u.name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {u.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {u.user_id}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{u.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={u.role}
                        color={
                          u.role === 'admin'
                            ? 'error'
                            : u.role === 'instructor'
                            ? 'primary'
                            : 'default'
                        }
                        variant={u.role === 'student' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.institution || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={u.is_active ? 'Active' : 'Inactive'}
                        color={u.is_active ? 'success' : 'default'}
                        variant={u.is_active ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title={u.is_active ? 'Deactivate' : 'Activate'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleActive(u)}
                              disabled={currentUser?.user_id === u.user_id}
                            >
                              {u.is_active ? (
                                <Block fontSize="small" />
                              ) : (
                                <CheckCircle fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(u)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleOpenDelete(u)}
                              disabled={currentUser?.user_id === u.user_id}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {users.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No users found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Showing {users.length} of {total} users
            </Typography>
            <TablePagination
              component="div"
              count={Number(total) || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Create / Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name"
                fullWidth
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                value={form.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>
            {!editingUser && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={form.password}
                  onChange={(e) => handleFormChange('password', e.target.value)}
                  helperText="Min 8 characters, strong password recommended"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={editingUser ? 6 : 6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={form.role}
                  onChange={(e) => handleFormChange('role', e.target.value)}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="instructor">Instructor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Institution (optional)"
                fullWidth
                value={form.institution}
                onChange={(e) => handleFormChange('institution', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => handleFormChange('is_active', e.target.checked)}
                  />
                }
                label="Active account"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveUser} disabled={loading}>
            {editingUser ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent dividers>
          {bulkDelete ? (
            <>
              <Typography variant="body2">
                Are you sure you want to delete {selectedIds.length} selected users?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This action cannot be undone. The selected users will lose access to the platform.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2">
                Are you sure you want to delete{' '}
                <strong>{selectedUserForDelete?.name}</strong>
                {' '}?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This action cannot be undone. The user will lose access to the platform.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
