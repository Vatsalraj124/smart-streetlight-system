import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button
} from '@mui/material';
import {
  AdminPanelSettings,
  Security
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Security sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You need administrator privileges to access this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <AdminPanelSettings sx={{ mr: 2 }} />
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user.name}! Administrative features coming soon.
        </Typography>
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Admin dashboard features will be implemented in future updates.
        </Alert>
        <Button variant="contained" href="/map">
          Go to Map Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;