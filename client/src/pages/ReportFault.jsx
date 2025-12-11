import React from 'react';
import {
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert
} from '@mui/material';
import {
  Report as ReportIcon,
  PhotoCamera,
  LocationOn,
  Description,
  CheckCircle
} from '@mui/icons-material';

const steps = ['Take Photo', 'Add Location', 'Add Details', 'Review & Submit'];

const ReportFault = () => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <ReportIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Report Streetlight Fault
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Help us fix faulty streetlights in 4 simple steps
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Stepper activeStep={0} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1">
              <strong>Coming Soon!</strong> The fault reporting system is under development.
            </Typography>
          </Alert>
          
          <Box sx={{ my: 4 }}>
            <PhotoCamera sx={{ fontSize: 100, color: 'primary.main', opacity: 0.5 }} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              Step 1: Upload Photo
            </Typography>
            <Typography color="text.secondary">
              Take a clear photo of the faulty streetlight
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              disabled
              startIcon={<PhotoCamera />}
            >
              Upload Photo
            </Button>
            <Button
              variant="outlined"
              disabled
              startIcon={<LocationOn />}
            >
              Get Location
            </Button>
            <Button
              variant="contained"
              disabled
              endIcon={<CheckCircle />}
            >
              Submit Report
            </Button>
          </Box>
        </Box>
      </Paper>

      <Alert severity="warning">
        <Typography variant="body2">
          <strong>Note:</strong> This feature requires backend integration. It will be fully functional after we complete:
        </Typography>
        <ul style={{ marginTop: 8, marginBottom: 0 }}>
          <li>Image upload API</li>
          <li>Location services</li>
          <li>AI integration</li>
          <li>Database connection</li>
        </ul>
      </Alert>
    </Box>
  );
};

export default ReportFault;