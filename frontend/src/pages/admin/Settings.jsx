import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Stack,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import { Save, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { settingsAPI, auditLogsAPI } from '../../services/api';

const Settings = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [settings, setSettings] = useState({});
  const [edited, setEdited] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [advancedSearch, setAdvancedSearch] = useState('');

  const generalKeys = ['site_name', 'default_language', 'max_file_upload_mb', 'plagiarism_threshold'];
  const booleanKeys = ['allow_registration', 'maintenance_mode', 'require_email_verification'];

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getAll();
      if (res?.data?.success) {
        const data = res.data.data || {};
        setSettings(data);
        setEdited(data);
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to load settings', {
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      enqueueSnackbar('Error loading settings', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const loadLastUpdated = async () => {
      try {
        const res = await auditLogsAPI.getByTable('system_settings');
        if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length) {
          setLastUpdated(res.data.data[0].created_at);
        }
      } catch (error) {
        console.error('Error loading settings audit logs:', error);
      }
    };

    loadLastUpdated();
  }, []);

  const handleChange = (key, value) => {
    setEdited((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const dirtyKeys = useMemo(
    () =>
      Object.keys(edited).filter((key) => {
        return settings[key] !== edited[key];
      }),
    [settings, edited]
  );

  const handleReset = () => {
    setEdited(settings);
  };

  const handleResetKey = (key) => {
    setEdited((prev) => ({
      ...prev,
      [key]: settings[key],
    }));
  };

  const handleSave = async () => {
    if (!dirtyKeys.length) {
      enqueueSnackbar('No changes to save', { variant: 'info' });
      return;
    }

    const payload = {};
    dirtyKeys.forEach((key) => {
      payload[key] = edited[key] ?? '';
    });

    try {
      setSaving(true);
      const res = await settingsAPI.updateMultiple(payload);
      if (res?.data?.success) {
        enqueueSnackbar(res.data.message || 'Settings updated', { variant: 'success' });
        setSettings((prev) => ({
          ...prev,
          ...payload,
        }));
      } else {
        enqueueSnackbar(res?.data?.message || 'Failed to update settings', {
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      enqueueSnackbar('Error updating settings', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.9)
            : 'linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 60%, #fff9c4 100%)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          General
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Core settings that control the overall look and feel of the platform.
        </Typography>

        <Stack spacing={2.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Site Name
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. SkillArc LMS"
                value={edited.site_name || ''}
                onChange={(e) => handleChange('site_name', e.target.value)}
              />
              <Button
                size="small"
                variant="text"
                onClick={() => handleResetKey('site_name')}
                disabled={settings.site_name === edited.site_name}
              >
                Reset
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Default Language
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. en"
                value={edited.default_language || ''}
                onChange={(e) => handleChange('default_language', e.target.value)}
                helperText="ISO language code used as default for new users (e.g. en, es, fr)."
              />
              <Button
                size="small"
                variant="text"
                onClick={() => handleResetKey('default_language')}
                disabled={settings.default_language === edited.default_language}
              >
                Reset
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Max File Upload Size (MB)
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 1 }}
                placeholder="e.g. 50"
                value={edited.max_file_upload_mb || ''}
                onChange={(e) => handleChange('max_file_upload_mb', e.target.value)}
                helperText="Maximum file upload size per file in megabytes."
              />
              <Button
                size="small"
                variant="text"
                onClick={() => handleResetKey('max_file_upload_mb')}
                disabled={settings.max_file_upload_mb === edited.max_file_upload_mb}
              >
                Reset
              </Button>
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Plagiarism Threshold (%)
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0, max: 100 }}
                placeholder="e.g. 30"
                value={edited.plagiarism_threshold || ''}
                onChange={(e) => handleChange('plagiarism_threshold', e.target.value)}
                helperText="Percentage similarity above which a submission is flagged."
              />
              <Button
                size="small"
                variant="text"
                onClick={() => handleResetKey('plagiarism_threshold')}
                disabled={settings.plagiarism_threshold === edited.plagiarism_threshold}
              >
                Reset
              </Button>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderAdvancedSettings = () => {
    const advancedEntries = Object.entries(edited).filter(
      ([key]) => !generalKeys.includes(key)
    );

    const q = advancedSearch.toLowerCase();
    const filteredAdvancedEntries = advancedEntries.filter(([key, value]) => {
      if (!q) return true;
      const v = value != null ? String(value) : '';
      return key.toLowerCase().includes(q) || v.toLowerCase().includes(q);
    });

    return (
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.9)
              : 'linear-gradient(135deg, #eceff1 0%, #e0f2f1 50%, #f1f8e9 100%)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Advanced
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Lower-level system settings loaded from <code>system_settings</code>. Edit with
            care.
          </Typography>
          {advancedEntries.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search settings by key or value"
                value={advancedSearch}
                onChange={(e) => setAdvancedSearch(e.target.value)}
              />
            </Box>
          )}

          {advancedEntries.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No advanced settings are currently defined in the database.
            </Typography>
          )}

          {advancedEntries.length > 0 && filteredAdvancedEntries.length === 0 && advancedSearch && (
            <Typography variant="body2" color="text.secondary">
              No settings match your search.
            </Typography>
          )}

          {filteredAdvancedEntries.length > 0 && (
            <Stack spacing={1.5}>
              {filteredAdvancedEntries.map(([key, value]) => {
                const isBool = booleanKeys.includes(key);
                const originalValue = settings[key];
                const isDirty = originalValue !== value;

                if (isBool) {
                  const normalized = String(value ?? '').toLowerCase();
                  const checked = normalized === '1' || normalized === 'true' || normalized === 'yes';

                  return (
                    <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {key}
                        </Typography>
                        <Typography variant="body2">
                          {checked ? 'Enabled' : 'Disabled'}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => handleResetKey(key)}
                          disabled={!isDirty}
                        >
                          Reset
                        </Button>
                        <Button
                          size="small"
                          variant={checked ? 'contained' : 'outlined'}
                          onClick={() =>
                            handleChange(key, checked ? '0' : '1')
                          }
                        >
                          {checked ? 'On' : 'Off'}
                        </Button>
                      </Stack>
                    </Box>
                  );
                }

                return (
                  <Box key={key}>
                    <Typography variant="caption" color="text.secondary">
                      {key}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={value ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleResetKey(key)}
                        disabled={!isDirty}
                      >
                        Reset
                      </Button>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={56} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="System Settings"
        subtitle="Configure global options for the learning platform"
        breadcrumbs={[
          { label: 'Admin', link: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderGeneralSettings()}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderAdvancedSettings()}
          </Grid>
        </Grid>

        <Card
          sx={{
            mt: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.9)
                : 'linear-gradient(135deg, #e8f5e9 0%, #fffde7 50%, #e3f2fd 100%)',
          }}
        >
          <CardContent
            sx={{
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Unsaved changes
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dirtyKeys.length === 0
                  ? 'All settings are up to date.'
                  : `${dirtyKeys.length} setting(s) modified. Don\'t forget to save.`}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Last settings change: {lastUpdated || 'Not available'}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
                disabled={dirtyKeys.length === 0 || saving}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={dirtyKeys.length === 0 || saving}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Save Changes
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Settings;
