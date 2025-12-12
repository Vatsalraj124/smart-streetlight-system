import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Stack,
  Divider,
  Alert,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  Fab,
  Zoom
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Download,
  Share,
  AddLocation,
  Timeline,
  Map as MapIcon,
  List,
  Dashboard as DashboardIcon,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  GpsFixed,
  Layers,
  ZoomIn,
  ZoomOut,
  MyLocation,
  Add,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import StreetlightMap from '../components/map/StreetlightMap';
import ReportCharts from '../components/charts/ReportCharts';
import { reportService } from '../services/api';

const MapDashboard = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    dateRange: 'all',
    search: ''
  });
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list' or 'grid'
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    assigned: 0,
    critical: 0
  });
  const [chartData, setChartData] = useState({});

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      // Mock data - replace with actual API call
      const mockReports = generateMockReports(20);
      
      setReports(mockReports);
      setFilteredReports(mockReports);
      
      // Calculate stats
      calculateStats(mockReports);
      
      // Generate chart data
      generateChartData(mockReports);
      
    } catch (error) {
      setError(error.message || 'Failed to load reports');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock reports for testing
  const generateMockReports = (count) => {
    const statuses = ['pending', 'assigned', 'in_progress', 'resolved', 'closed'];
    const conditions = ['not_working', 'flickering', 'broken_pole', 'partial_fault', 'working'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const addresses = [
      'Near CST Station, Mumbai',
      'Main Road, Bandra West',
      'Commercial Street, Andheri',
      'Residential Area, Powai',
      'Near City Park, Dadar',
      'Shopping Complex, Kurla',
      'Hospital Road, Byculla',
      'School Street, Santacruz'
    ];
    
    const reports = [];
    const baseLat = 19.0760;
    const baseLng = 72.8777;
    
    for (let i = 1; i <= count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const address = addresses[Math.floor(Math.random() * addresses.length)];
      
      // Generate random coordinates near Mumbai
      const lat = baseLat + (Math.random() - 0.5) * 0.05;
      const lng = baseLng + (Math.random() - 0.5) * 0.05;
      
      const daysAgo = Math.floor(Math.random() * 30);
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - daysAgo);
      
      reports.push({
        id: `report-${i}`,
        title: `Streetlight Issue #${i} - ${condition.replace('_', ' ')}`,
        description: `This streetlight has been ${condition.replace('_', ' ')} for the past few days. ${severity === 'critical' ? 'Requires immediate attention!' : 'Needs to be fixed soon.'}`,
        location: {
          coordinates: [lng, lat],
          address: address
        },
        status: status,
        lightCondition: condition,
        severity: severity,
        createdAt: createdDate.toISOString(),
        reportedBy: { 
          name: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'][Math.floor(Math.random() * 4)],
          email: 'user@example.com'
        },
        assignedTo: status === 'assigned' || status === 'in_progress' ? 'Worker #' + Math.floor(Math.random() * 10) : null,
        priority: severity === 'critical' ? 'High' : severity === 'high' ? 'Medium' : 'Low'
      });
    }
    
    return reports;
  };

  // Calculate statistics
  const calculateStats = (reportList) => {
    const stats = {
      total: reportList.length,
      pending: reportList.filter(r => r.status === 'pending').length,
      resolved: reportList.filter(r => r.status === 'resolved' || r.status === 'closed').length,
      assigned: reportList.filter(r => r.status === 'assigned' || r.status === 'in_progress').length,
      critical: reportList.filter(r => r.severity === 'critical').length
    };
    setStats(stats);
  };

  // Generate chart data
  const generateChartData = (reportList) => {
    // Status distribution
    const statusCount = {};
    const conditionCount = {};
    const severityCount = {};
    
    reportList.forEach(report => {
      statusCount[report.status] = (statusCount[report.status] || 0) + 1;
      conditionCount[report.lightCondition] = (conditionCount[report.lightCondition] || 0) + 1;
      severityCount[report.severity] = (severityCount[report.severity] || 0) + 1;
    });
    
    const statusDistribution = Object.entries(statusCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: getStatusColor(name)
    }));
    
    const conditionDistribution = Object.entries(conditionCount).map(([name, value]) => ({
      name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
      value,
      color: getConditionColor(name)
    }));
    
    const severityStats = Object.entries(severityCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: getSeverityColor(name)
    }));
    
    setChartData({
      statusDistribution,
      conditionDistribution,
      severityStats
    });
  };

  // Helper functions for colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#FF9800';
      case 'assigned': return '#2196F3';
      case 'in_progress': return '#9C27B0';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#607D8B';
      default: return '#666666';
    }
  };

  const getConditionColor = (condition) => {
    switch(condition) {
      case 'not_working': return '#F44336';
      case 'flickering': return '#FFC107';
      case 'broken_pole': return '#795548';
      case 'partial_fault': return '#3F51B5';
      case 'working': return '#4CAF50';
      default: return '#666666';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#1976D2';
      case 'low': return '#388E3C';
      default: return '#666666';
    }
  };

  // Apply filters
  const applyFilters = () => {
    let filtered = [...reports];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    // Severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(report => report.severity === filters.severity);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch(filters.dateRange) {
        case 'today':
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.createdAt);
        return reportDate >= cutoffDate;
      });
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm) ||
        report.description.toLowerCase().includes(searchTerm) ||
        report.location?.address?.toLowerCase().includes(searchTerm) ||
        report.reportedBy?.name.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredReports(filtered);
    calculateStats(filtered);
    generateChartData(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle report selection
  const handleReportSelect = (report) => {
    setSelectedReport(report);
    // Center map on selected report
    if (report.location?.coordinates) {
      const [lng, lat] = report.location.coordinates;
      setMapCenter([lat, lng]);
    }
  };

  // Handle view mode change
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [filters, reports]);

  // Stats cards data
  const statCards = [
    {
      title: 'Total Reports',
      value: stats.total,
      icon: <DashboardIcon />,
      color: '#667eea',
      description: 'All reports in system'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: <Schedule />,
      color: '#FF9800',
      description: 'Awaiting action'
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: <CheckCircle />,
      color: '#4CAF50',
      description: 'Successfully fixed'
    },
    {
      title: 'Critical',
      value: stats.critical,
      icon: <Warning />,
      color: '#F44336',
      description: 'High priority issues'
    }
  ];

  // Status options for filter
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  // Severity options for filter
  const severityOptions = [
    { value: 'all', label: 'All Severity' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  // Date range options
  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' }
  ];

  return (
    <Box sx={{ height: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <MapIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Streetlight Monitoring Dashboard
          </Typography>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchReports}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
            >
              Export Data
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              href="/report"
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Report New Issue
            </Button>
          </Stack>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Monitor and manage streetlight reports across the city in real-time
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {stat.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterList sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Filters & Controls
          </Typography>
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="map">
              <MapIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewList />
            </ToggleButton>
            <ToggleButton value="grid">
              <ViewModule />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search reports by title, description, or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                label="Severity"
              >
                {severityOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                label="Date Range"
              >
                {dateOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={2}>
            <Stack direction="row" spacing={1} sx={{ height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Badge badgeContent={filteredReports.length} color="primary">
                <Chip 
                  label="Results" 
                  color="primary" 
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Badge>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Area */}
      {loading ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography>Loading dashboard data...</Typography>
        </Paper>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchReports}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <>
          {viewMode === 'map' ? (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Paper sx={{ height: '600px', overflow: 'hidden', borderRadius: 2 }}>
                  <StreetlightMap
                    reports={filteredReports}
                    center={mapCenter}
                    zoom={selectedReport ? 15 : 13}
                    height="600px"
                    onMarkerClick={handleReportSelect}
                    selectedReport={selectedReport}
                  />
                </Paper>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Paper sx={{ height: '600px', overflow: 'auto', p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <GpsFixed sx={{ mr: 1 }} />
                    {selectedReport ? 'Selected Report' : 'Report Details'}
                  </Typography>
                  
                  {selectedReport ? (
                    <Box>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {selectedReport.title}
                          </Typography>
                          
                          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip
                              label={selectedReport.status}
                              size="small"
                              color={
                                selectedReport.status === 'resolved' ? 'success' :
                                selectedReport.status === 'pending' ? 'warning' :
                                selectedReport.status === 'assigned' ? 'info' : 'default'
                              }
                            />
                            <Chip
                              label={selectedReport.severity}
                              size="small"
                              variant="outlined"
                              color={
                                selectedReport.severity === 'critical' ? 'error' :
                                selectedReport.severity === 'high' ? 'warning' :
                                selectedReport.severity === 'medium' ? 'info' : 'success'
                              }
                            />
                            <Chip
                              label={selectedReport.lightCondition?.replace('_', ' ') || 'Unknown'}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {selectedReport.description}
                          </Typography>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" gutterBottom>
                                Location
                              </Typography>
                              <Typography variant="body2">
                                {selectedReport.location?.address || 'No address'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" gutterBottom>
                                Reported By
                              </Typography>
                              <Typography variant="body2">
                                {selectedReport.reportedBy?.name || 'Anonymous'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" gutterBottom>
                                Reported On
                              </Typography>
                              <Typography variant="body2">
                                {new Date(selectedReport.createdAt).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" gutterBottom>
                                Priority
                              </Typography>
                              <Typography variant="body2">
                                {selectedReport.priority}
                              </Typography>
                            </Grid>
                          </Grid>
                          
                          <Button
                            variant="contained"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={() => window.location.href = `/reports/${selectedReport.id}`}
                          >
                            View Full Details
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Divider sx={{ my: 3 }} />
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      Click on any marker on the map to view report details
                    </Alert>
                  )}
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <ViewList sx={{ mr: 1 }} />
                    Recent Reports ({filteredReports.length})
                  </Typography>
                  
                  <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                    {filteredReports.slice(0, 10).map((report, index) => (
                      <Card 
                        key={index} 
                        variant="outlined" 
                        sx={{ 
                          mb: 1, 
                          cursor: 'pointer',
                          borderColor: selectedReport?.id === report.id ? 'primary.main' : 'divider',
                          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
                        }}
                        onClick={() => handleReportSelect(report)}
                      >
                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 'medium' }}>
                            {report.title}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Chip
                              label={report.status}
                              size="small"
                              sx={{ height: 20 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          ) : viewMode === 'list' ? (
            // List View
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Report List ({filteredReports.length} reports)
              </Typography>
              
              <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
                {filteredReports.map((report, index) => (
                  <Card key={index} sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                            {report.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {report.description.substring(0, 150)}...
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                            {report.location?.address}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6} md={2}>
                          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                            <Chip
                              label={report.status}
                              size="small"
                              color={
                                report.status === 'resolved' ? 'success' :
                                report.status === 'pending' ? 'warning' :
                                report.status === 'assigned' ? 'info' : 'default'
                              }
                            />
                          </Stack>
                        </Grid>
                        
                        <Grid item xs={6} md={2}>
                          <Typography variant="body2">
                            Priority: <strong>{report.priority}</strong>
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={2}>
                          <Button
                            size="small"
                            variant="outlined"
                            fullWidth
                            onClick={() => handleReportSelect(report)}
                            startIcon={<MapIcon />}
                          >
                            View on Map
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              
              {filteredReports.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No reports found matching your filters
                </Alert>
              )}
            </Paper>
          ) : (
            // Grid/Charts View
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <ReportCharts data={chartData} onRefresh={fetchReports} loading={loading} />
            </Paper>
          )}
        </>
      )}

      {/* Floating Action Button for quick actions */}
      <Zoom in={!loading}>
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
          href="/report"
        >
          <Add />
        </Fab>
      </Zoom>

      {/* Footer Stats */}
      <Paper sx={{ p: 2, mt: 3, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Last Updated: {new Date().toLocaleTimeString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" align="center">
              Data Range: {filters.dateRange === 'all' ? 'All Time' : `Last ${filters.dateRange}`}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary" align="right">
              Showing {filteredReports.length} of {reports.length} reports
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default MapDashboard;