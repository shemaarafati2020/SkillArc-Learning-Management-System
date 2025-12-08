import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  alpha,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Publish,
  Add,
  Close,
  CloudUpload,
  School,
  Description,
  Settings,
  Preview,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/common/PageHeader';
import { coursesAPI } from '../../services/api';

const CourseCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = Boolean(id);
  const [activeStep, setActiveStep] = useState(0);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    duration: '',
    price: '',
    language: 'English',
    prerequisites: [],
    learningOutcomes: [],
    tags: [],
  });
  const [prerequisiteInput, setPrerequisiteInput] = useState('');
  const [outcomeInput, setOutcomeInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const steps = ['Basic Information', 'Course Details', 'Content & Media', 'Review & Publish'];

  const categories = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'Design',
    'Business',
    'Marketing',
    'Photography',
  ];

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  const handleInputChange = (field) => (event) => {
    setCourseData({ ...courseData, [field]: event.target.value });
  };

  const handleAddItem = (field, input, setInput) => {
    if (input.trim()) {
      setCourseData({
        ...courseData,
        [field]: [...courseData[field], input.trim()],
      });
      setInput('');
    }
  };

  const handleRemoveItem = (field, index) => {
    setCourseData({
      ...courseData,
      [field]: courseData[field].filter((_, i) => i !== index),
    });
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar('Please upload an image file', { variant: 'error' });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        enqueueSnackbar('File size must be less than 5MB', { variant: 'error' });
        return;
      }

      setThumbnail(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      enqueueSnackbar('Thumbnail uploaded successfully!', { variant: 'success' });
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview(null);
  };

  // Load existing course when in edit mode
  useEffect(() => {
    const loadCourse = async () => {
      if (!isEditMode) return;
      setInitialLoading(true);
      try {
        const res = await coursesAPI.getById(id);
        if (res?.data?.success) {
          const c = res.data.data;
          setCourseData((prev) => ({
            ...prev,
            title: c.title || '',
            description: c.description || '',
            category: c.category || '',
            // Map optional fields if present
            level: c.level || prev.level,
            duration: c.duration || prev.duration,
            price: c.price || prev.price,
          }));
          if (c.thumbnail_url) {
            setThumbnailPreview(c.thumbnail_url);
          }
        } else {
          enqueueSnackbar(res?.data?.message || 'Failed to load course for editing', {
            variant: 'error',
          });
        }
      } catch (error) {
        console.error('Error loading course for edit:', error);
        enqueueSnackbar('Error loading course for edit', { variant: 'error' });
      } finally {
        setInitialLoading(false);
      }
    };

    loadCourse();
  }, [id, isEditMode, enqueueSnackbar]);

  const saveCourse = async (status, navigateAfter) => {
    if (!courseData.title.trim()) {
      enqueueSnackbar('Course title is required', { variant: 'warning' });
      return;
    }

    const payload = {
      title: courseData.title.trim(),
      description: courseData.description.trim(),
      category: courseData.category || null,
      status,
    };

    try {
      setSaving(true);
      if (isEditMode) {
        const res = await coursesAPI.update(id, payload);
        if (res?.data?.success) {
          enqueueSnackbar('Course updated successfully', { variant: 'success' });
          if (navigateAfter) {
            navigate(`/courses/${id}`);
          }
        } else {
          enqueueSnackbar(res?.data?.message || 'Failed to update course', {
            variant: 'error',
          });
        }
      } else {
        const res = await coursesAPI.create(payload);
        if (res?.data?.success) {
          enqueueSnackbar('Course created successfully', { variant: 'success' });
          const created = res.data.data;
          const newId = created?.course_id;
          if (navigateAfter && newId) {
            navigate(`/courses/${newId}`);
          } else if (navigateAfter) {
            navigate('/courses');
          }
        } else {
          enqueueSnackbar(res?.data?.message || 'Failed to create course', {
            variant: 'error',
          });
        }
      }
    } catch (error) {
      console.error('Error saving course:', error);
      enqueueSnackbar('Error saving course', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => {
    saveCourse('draft', false);
  };

  const handlePublish = () => {
    saveCourse('published', true);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Course Title"
                value={courseData.title}
                onChange={handleInputChange('title')}
                placeholder="e.g., Complete Web Development Bootcamp"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                      borderWidth: 2,
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Course Description"
                value={courseData.description}
                onChange={handleInputChange('description')}
                placeholder="Describe what students will learn in this course..."
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={courseData.category}
                  onChange={handleInputChange('category')}
                  label="Category"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={courseData.level}
                  onChange={handleInputChange('level')}
                  label="Level"
                >
                  {levels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                value={courseData.duration}
                onChange={handleInputChange('duration')}
                placeholder="e.g., 40"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Price ($)"
                type="number"
                value={courseData.price}
                onChange={handleInputChange('price')}
                placeholder="e.g., 99.99"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select
                  value={courseData.language}
                  onChange={handleInputChange('language')}
                  label="Language"
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Spanish">Spanish</MenuItem>
                  <MenuItem value="French">French</MenuItem>
                  <MenuItem value="German">German</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Prerequisites */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Prerequisites
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={prerequisiteInput}
                  onChange={(e) => setPrerequisiteInput(e.target.value)}
                  placeholder="Add a prerequisite..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem('prerequisites', prerequisiteInput, setPrerequisiteInput);
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleAddItem('prerequisites', prerequisiteInput, setPrerequisiteInput)}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {courseData.prerequisites.map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    onDelete={() => handleRemoveItem('prerequisites', index)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>

            {/* Learning Outcomes */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Learning Outcomes
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={outcomeInput}
                  onChange={(e) => setOutcomeInput(e.target.value)}
                  placeholder="What will students learn?"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem('learningOutcomes', outcomeInput, setOutcomeInput);
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleAddItem('learningOutcomes', outcomeInput, setOutcomeInput)}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {courseData.learningOutcomes.map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    onDelete={() => handleRemoveItem('learningOutcomes', index)}
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {thumbnailPreview ? (
                <Box sx={{ position: 'relative' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '2px solid',
                      borderColor: 'success.main',
                      borderRadius: 3,
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(76, 175, 80, 0.05)' 
                        : 'rgba(76, 175, 80, 0.02)',
                    }}
                  >
                    <Box sx={{ position: 'relative', width: '100%', height: 300, mb: 2 }}>
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px',
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Close />}
                        onClick={handleRemoveThumbnail}
                      >
                        Remove
                      </Button>
                      <Button variant="outlined" component="label">
                        Change Image
                        <input 
                          type="file" 
                          hidden 
                          accept="image/*" 
                          onChange={handleFileUpload}
                        />
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              ) : (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: 'divider',
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(102, 126, 234, 0.05)' 
                      : 'rgba(102, 126, 234, 0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(102, 126, 234, 0.1)' 
                        : 'rgba(102, 126, 234, 0.05)',
                    },
                  }}
                >
                  <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Upload Course Thumbnail
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Drag and drop or click to browse (Max 5MB)
                  </Typography>
                  <Button variant="outlined" component="label">
                    Choose File
                    <input 
                      type="file" 
                      hidden 
                      accept="image/*" 
                      onChange={handleFileUpload}
                    />
                  </Button>
                </Paper>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Course Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tags for better discoverability..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem('tags', tagInput, setTagInput);
                    }
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleAddItem('tags', tagInput, setTagInput)}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {courseData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveItem('tags', index)}
                    color="info"
                    variant="filled"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
              Review Your Course
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? 'rgba(102, 126, 234, 0.05)' 
                      : 'background.paper',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                      {courseData.title || 'Untitled Course'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {courseData.description || 'No description provided'}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Category
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {courseData.category || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Level
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {courseData.level || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Duration
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {courseData.duration ? `${courseData.duration} hours` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">
                          Price
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {courseData.price ? `$${courseData.price}` : 'Free'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  if (isEditMode && initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={56} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Edit Course' : 'Create New Course'}
        subtitle={
          isEditMode
            ? 'Update your course details and content'
            : 'Build an engaging learning experience for your students'
        }
        icon={<School />}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Courses', path: '/courses' },
          { label: isEditMode ? 'Edit' : 'Create' },
        ]}
        actions={
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            sx={{ textTransform: 'none' }}
          >
            Back to Dashboard
          </Button>
        }
      />

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* Stepper */}
        <Box
          sx={{
            p: 3,
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
              : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {renderStepContent(activeStep)}
        </CardContent>

        {/* Actions */}
        <Box
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(0,0,0,0.2)' 
              : 'rgba(0,0,0,0.02)',
          }}
        >
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={handleSaveDraft}
              sx={{ textTransform: 'none', fontWeight: 600 }}
              disabled={saving}
            >
              Save Draft
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                startIcon={<Publish />}
                onClick={handlePublish}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                  },
                }}
                disabled={saving}
              >
                Publish Course
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                sx={{ textTransform: 'none', fontWeight: 600 }}
                disabled={saving}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default CourseCreate;
