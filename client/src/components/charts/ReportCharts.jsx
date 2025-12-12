import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Timeline,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Refresh,
  ShowChart,
  DonutLarge
} from '@mui/icons-material';

const ReportCharts = ({ data = {}, onRefresh, loading = false }) => {
  // Default sample data structure
  const defaultData = {
    dailyStats: [
      { date: 'Mon', reports: 12, resolved: 8, pending: 4 },
      { date: 'Tue', reports: 15, resolved: 10, pending: 5 },
      { date: 'Wed', reports: 8, resolved: 6, pending: 2 },
      { date: 'Thu', reports: 20, resolved: 15, pending: 5 },
      { date: 'Fri', reports: 18, resolved: 12, pending: 6 },
      { date: 'Sat', reports: 14, resolved: 10, pending: 4 },
      { date: 'Sun', reports: 16, resolved: 12, pending: 4 }
    ],
    statusDistribution: [
      { name: 'Pending', value: 25, color: '#FF9800' },
      { name: 'Assigned', value: 15, color: '#2196F3' },
      { name: 'In Progress', value: 10, color: '#9C27B0' },
      { name: 'Resolved', value: 35, color: '#4CAF50' },
      { name: 'Closed', value: 15, color: '#607D8B' }
    ],
    conditionDistribution: [
      { name: 'Not Working', value: 40, color: '#F44336' },
      { name: 'Flickering', value: 25, color: '#FFC107' },
      { name: 'Broken Pole', value: 15, color: '#795548' },
      { name: 'Partial Fault', value: 12, color: '#3F51B5' },
      { name: 'Working', value: 8, color: '#4CAF50' }
    ],
    severityStats: [
      { name: 'Critical', value: 8, color: '#D32F2F' },
      { name: 'High', value: 15, color: '#F57C00' },
      { name: 'Medium', value: 35, color: '#1976D2' },
      { name: 'Low', value: 42, color: '#388E3C' }
    ],
    resolutionTime: [
      { hour: '9 AM', time: 2.5 },
      { hour: '12 PM', time: 3.2 },
      { hour: '3 PM', time: 2.8 },
      { hour: '6 PM', time: 4.1 },
      { hour: '9 PM', time: 5.3 }
    ]
  };

  // Use provided data or defaults
  const chartData = {
    dailyStats: data.dailyStats || defaultData.dailyStats,
    statusDistribution: data.statusDistribution || defaultData.statusDistribution,
    conditionDistribution: data.conditionDistribution || defaultData.conditionDistribution,
    severityStats: data.severityStats || defaultData.severityStats,
    resolutionTime: data.resolutionTime || defaultData.resolutionTime
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, border: '1px solid #ccc', bgcolor: 'background.paper' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color, display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: entry.color,
                  mr: 1
                }}
              />
              {entry.name}: {entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
          Analytics Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select defaultValue="week" label="Time Range">
              <MenuItem value="day">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          
          <IconButton onClick={onRefresh} disabled={loading} size="small">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3}>
        {/* Daily Reports Area Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Daily Reports Trend
              </Typography>
            </Box>
            
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="reports"
                  stackId="1"
                  stroke="#667eea"
                  fill="#667eea"
                  fillOpacity={0.3}
                  name="New Reports"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stackId="1"
                  stroke="#4CAF50"
                  fill="#4CAF50"
                  fillOpacity={0.3}
                  name="Resolved"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  stroke="#FF9800"
                  fill="#FF9800"
                  fillOpacity={0.3}
                  name="Pending"
                />
              </AreaChart>
            </ResponsiveContainer>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Shows daily report submissions and resolutions over time
            </Typography>
          </Paper>
        </Grid>

        {/* Status Distribution Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PieChartIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Status Distribution
              </Typography>
            </Box>
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} reports`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
              {chartData.statusDistribution.map((item, index) => (
                <Box
                  key={index}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1 }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: item.color
                    }}
                  />
                  <Typography variant="caption">
                    {item.name}: {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Condition Distribution Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BarChartIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Light Condition Analysis
              </Typography>
            </Box>
            
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.conditionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Reports" radius={[4, 4, 0, 0]}>
                  {chartData.conditionDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Distribution of different streetlight conditions reported
            </Typography>
          </Paper>
        </Grid>

        {/* Resolution Time Line Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShowChart sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Average Resolution Time
              </Typography>
            </Box>
            
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.resolutionTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} hours`, 'Resolution Time']} />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke="#9C27B0"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Hours"
                />
              </LineChart>
            </ResponsiveContainer>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Average time taken to resolve reports throughout the day
            </Typography>
          </Paper>
        </Grid>

        {/* Severity Donut Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DonutLarge sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Severity Breakdown
              </Typography>
            </Box>
            
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.severityStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.severityStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} reports`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mt: 2 }}>
              {chartData.severityStats.map((item, index) => (
                <Box key={index} sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      mx: 'auto',
                      mb: 0.5
                    }}
                  />
                  <Typography variant="caption" display="block">
                    {item.name}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Summary Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Performance Metrics
            </Typography>
            
            <Grid container spacing={2}>
              {[
                { 
                  label: 'Avg. Resolution Time', 
                  value: '2.3 days', 
                  change: '+5%', 
                  color: 'primary',
                  progress: 65
                },
                { 
                  label: 'High Priority Issues', 
                  value: '23', 
                  change: '-12%', 
                  color: 'error',
                  progress: 45
                },
                { 
                  label: 'Citizen Satisfaction', 
                  value: '4.2/5', 
                  change: '+8%', 
                  color: 'success',
                  progress: 84
                },
                { 
                  label: 'Worker Efficiency', 
                  value: '87%', 
                  change: '+3%', 
                  color: 'info',
                  progress: 87
                }
              ].map((stat, index) => (
                <Grid item xs={6} key={index}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {stat.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: stat.change.startsWith('+') ? 'success.main' : 'error.main'
                          }}
                        >
                          {stat.change} from last week
                        </Typography>
                        <Box sx={{ width: 60 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={stat.progress} 
                            color={stat.color}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportCharts;