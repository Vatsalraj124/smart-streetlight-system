import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Link as MuiLink,
  Grid,
  IconButton
} from '@mui/material';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  GitHub,
  WbIncandescent
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[900],
        color: 'white'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WbIncandescent sx={{ mr: 1, fontSize: 30 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                StreetLight Watch
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Making our cities safer, one streetlight at a time.
            </Typography>
            <Box>
              <IconButton sx={{ color: 'white' }} href="#">
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: 'white' }} href="#">
                <Twitter />
              </IconButton>
              <IconButton sx={{ color: 'white' }} href="#">
                <Instagram />
              </IconButton>
              <IconButton sx={{ color: 'white' }} href="#">
                <GitHub />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Links
            </Typography>
            <MuiLink 
              component={Link} 
              to="/report" 
              color="inherit" 
              display="block" 
              sx={{ mb: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Report Fault
            </MuiLink>
            <MuiLink 
              component={Link} 
              to="/dashboard" 
              color="inherit" 
              display="block" 
              sx={{ mb: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Dashboard
            </MuiLink>
            <MuiLink 
              component={Link} 
              to="/status" 
              color="inherit" 
              display="block" 
              sx={{ mb: 1, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Check Status
            </MuiLink>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Contact
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Email: support@streetlightwatch.com
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Phone: +91 98765 43210
            </Typography>
            <Typography variant="body2">
              Address: Smart City Office, India
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'grey.800' }}>
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} StreetLight Watch. All rights reserved.
          </Typography>
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Developed for Smart City Initiative
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;