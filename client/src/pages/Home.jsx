import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Container,
  Paper
} from '@mui/material';
import { 
  Report, 
  TrackChanges, 
  Analytics, 
  Security,
  ArrowForward
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Home = () => {
  const features = [
    {
      icon: <Report sx={{ fontSize: 50, color: '#667eea' }} />,
      title: 'Quick Reporting',
      description: 'Report faulty streetlights in just 30 seconds with photo upload.'
    },
    {
      icon: <TrackChanges sx={{ fontSize: 50, color: '#764ba2' }} />,
      title: 'AI Detection',
      description: 'Artificial intelligence automatically detects light conditions.'
    },
    {
      icon: <Analytics sx={{ fontSize: 50, color: '#f093fb' }} />,
      title: 'Real-time Tracking',
      description: 'Track repair status and maintenance progress in real-time.'
    },
    {
      icon: <Security sx={{ fontSize: 50, color: '#4facfe' }} />,
      title: 'Verified System',
      description: 'Each report is verified before dispatch to field workers.'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Paper 
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7))',
          py: 12,
          px: 3,
          textAlign: 'center',
          animation: `${fadeIn} 1s ease-out`
        }}
      >
        <Container maxWidth="md">
          <Typography 
            component="h1" 
            variant="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Illuminate Your City
          </Typography>
          <Typography variant="h5" paragraph sx={{ mb: 4, opacity: 0.9 }}>
            Report faulty streetlights instantly. Help make your city safer and brighter.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              component={Link}
              to="/report"
              size="large"
              endIcon={<ArrowForward />}
              sx={{ 
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s'
              }}
            >
              Report Now
            </Button>
            <Button
              variant="outlined"
              component={Link}
              to="/dashboard"
              size="large"
              sx={{ 
                px: 4,
                py: 1.5,
                color: 'white',
                borderColor: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: 'white'
                }
              }}
            >
              View Dashboard
            </Button>
          </Box>
        </Container>
      </Paper>

      {/* Features Section */}
      <Container sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          align="center" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            mb: 6,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          How It Works
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 20px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                    {feature.title}
                  </Typography>
                  <Typography>
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                  <Button 
                    size="small" 
                    endIcon={<ArrowForward />}
                    sx={{ 
                      color: '#667eea',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.1)'
                      }
                    }}
                  >
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                  1,234
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Reports Fixed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#764ba2' }}>
                  567
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Active Workers
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#f093fb' }}>
                  89%
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  AI Accuracy
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#4facfe' }}>
                  24h
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Avg. Response
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;