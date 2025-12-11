import { Router } from 'express';
import { successResponse } from '../utils/response.js';

const router = Router();

router.get('/docs', (req, res) => {
  const docs = {
    name: 'Smart Streetlight System API',
    version: '1.0.0',
    description: 'Backend API for streetlight fault detection system',
    endpoints: {
      health: {
        GET: '/api/health',
        description: 'Server health check'
      },
      auth: {
        POST: '/api/auth/register',
        POST: '/api/auth/login',
        description: 'User authentication'
      },
      reports: {
        GET: '/api/reports',
        POST: '/api/reports',
        description: 'Streetlight reports management'
      }
    },
    status: 'active'
  };
  
  successResponse(res, docs, 'API Documentation');
});

export default router;