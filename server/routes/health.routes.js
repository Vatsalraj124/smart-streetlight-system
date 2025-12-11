import { Router } from 'express';
import { successResponse } from '../utils/response.js';

const router = Router();

router.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
  
  successResponse(res, healthData, 'Server is healthy');
});

export default router;