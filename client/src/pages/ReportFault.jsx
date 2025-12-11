import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  Grid,
  Chip,
  Slider,
  InputAdornment
} from '@mui/material';
import {
  Report as ReportIcon,
  PhotoCamera,
  LocationOn,
  Description,
  CheckCircle,
  Delete,
  AddPhotoAlternate,
  GpsFixed,
  Warning,
  Lightbulb,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/api';

const steps = ['Location', 'Details', 'Photos', 'Review'];

const lightConditions = [
  { value: 'not_working', label: 'Not Working', color: 'error' },
  { value: 'flickering', label: 'Flickering', color: 'warning' },
  { value: 'broken_pole', label: 'Broken Pole', color: 'error' },
  { value: 'damaged_head', label: 'Damaged Head', color: 'warning' },
  { value: 'partial_fault', label: 'Partial Fault', color: 'info' },
  { value: 'working', label: 'Working', color: 'success' }
];

const severities = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
  { value: 'critical', label: 'Critical', color: 'error' }
];

const ReportFault = () => {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    lightCondition: 'not_working',
    severity: 'medium',
    poleNumber: '',
    address: '',
    city: '',
    pincode: ''
  });
  
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setLocationLoading(false);
      },
      (error) => {
        setLocationError(`Unable to get location: ${error.message}`);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    
    const newImages = [...images, ...files];
    setImages(newImages);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Remove image
  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Handle step navigation
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Validate form
  const validateForm = () => {
    const errors = [];
    
    if (!formData.title) errors.push('Title is required');
    if (!formData.latitude || !formData.longitude) errors.push('Location is required');
    if (!formData.lightCondition) errors.push('Light condition is required');
    if (images.length === 0) errors.push('At least one photo is required');
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Append images
      images.forEach((image, index) => {
        formDataToSend.append('images', image);
      });
      
      // Submit report
      const response = await reportService.create(formDataToSend);
      
      setSuccess(true);
      setActiveStep(steps.length); // Complete
      
      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
      
    } catch (error) {
      setError(error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      latitude: '',
      longitude: '',
      lightCondition: 'not_working',
      severity: 'medium',
      poleNumber: '',
      address: '',
      city: '',
      pincode: ''
    });
    setImages([]);
    setImagePreviews([]);
    setActiveStep(0);
    setSuccess(false);
    setError('');
  };

  // Get step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Location Information
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<GpsFixed />}
                onClick={getCurrentLocation}
                disabled={locationLoading}
                fullWidth
              >
                {locationLoading ? 'Getting Location...' : 'Use Current Location'}
              </Button>
              
              {locationError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {locationError}
                </Alert>
              )}
              
              {formData.latitude && formData.longitude && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Location captured: {formData.latitude}, {formData.longitude}
                </Alert>
              )}
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Tip:</strong> Make sure you're near the faulty streetlight when capturing location.
              </Typography>
            </Alert>
          </Box>
        );
        
      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Streetlight Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Report Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  helperText="Brief description of the issue"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  helperText="Additional details about the problem"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Light Condition</InputLabel>
                  <Select
                    name="lightCondition"
                    value={formData.lightCondition}
                    onChange={handleInputChange}
                    label="Light Condition"
                  >
                    {lightConditions.map((condition) => (
                      <MenuItem key={condition.value} value={condition.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Lightbulb sx={{ mr: 1, color: `${condition.color}.main` }} />
                          {condition.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    label="Severity"
                  >
                    {severities.map((severity) => (
                      <MenuItem key={severity.value} value={severity.value}>
                        <Chip
                          label={severity.label}
                          size="small"
                          color={severity.color}
                          variant="outlined"
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Pole Number (if visible)"
                  name="poleNumber"
                  value={formData.poleNumber}
                  onChange={handleInputChange}
                  helperText="Look for identification number on the pole"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="warning">
                  <Typography variant="body2">
                    <strong>Note:</strong> Provide accurate information to help workers locate and fix the issue quickly.
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Photos
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Guidelines:</strong>
                <ul>
                  <li>Take clear photos of the faulty streetlight</li>
                  <li>Include the entire pole if possible</li>
                  <li>Capture the light condition (day/night)</li>
                  <li>Maximum 5 photos allowed</li>
                  <li>Each photo should be less than 5MB</li>
                </ul>
              </Typography>
            </Alert>
            
            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<AddPhotoAlternate />}
                disabled={images.length >= 5}
              >
                Add Photos
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {images.length} of 5 photos selected
              </Typography>
            </Box>
            
            {imagePreviews.length > 0 && (
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {imagePreviews.map((preview, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="140"
                        image={preview}
                        alt={`Preview ${index + 1}`}
                      />
                      <CardActions sx={{ justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeImage(index)}
                        >
                          <Delete />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            
            {images.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <PhotoCamera sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">
                  No photos uploaded yet. Add photos to help us understand the issue better.
                </Typography>
              </Box>
            )}
          </Box>
        );
        
      case 3:
        return (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Review & Submit
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Report Details
                  </Typography>
                  <Typography variant="body1">{formData.title}</Typography>
                  {formData.description && (
                    <Typography variant="body2" color="text.secondary">
                      {formData.description}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Condition
                  </Typography>
                  <Chip
                    label={lightConditions.find(l => l.value === formData.lightCondition)?.label}
                    color={lightConditions.find(l => l.value === formData.lightCondition)?.color}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Severity
                  </Typography>
                  <Chip
                    label={severities.find(s => s.value === formData.severity)?.label}
                    color={severities.find(s => s.value === formData.severity)?.color}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body2">
                    {formData.latitude}, {formData.longitude}
                  </Typography>
                  {formData.address && (
                    <Typography variant="body2">
                      {formData.address}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Photos
                  </Typography>
                  <Typography variant="body2">
                    {images.length} photo(s) uploaded
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Ready to submit your report! Once submitted, our team will review it and take appropriate action.
              </Typography>
            </Alert>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  // Success view
  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
        <Typography variant="h4" gutterBottom>
          Report Submitted Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your report has been received. Our team will review it and take appropriate action.
          You can track the status from your dashboard.
        </Typography>
        <Button
          variant="contained"
          onClick={resetForm}
          startIcon={<ReportIcon />}
        >
          Submit Another Report
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <ReportIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Report Streetlight Fault
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Help us fix faulty streetlights in {steps.length} simple steps
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {getStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : null}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              'Submit Report'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>

      <Alert severity="info">
        <Typography variant="body2">
          <strong>Need help?</strong> Contact support if you're having trouble submitting a report.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ReportFault;