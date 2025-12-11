import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getAllUsers
} from '../controllers/auth.controller.js';
import {
  protect,
  restrictTo,
  validateRegistration,
  validateLogin,
  authRateLimit
} from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply rate limiting to auth routes
const limiter = rateLimit(authRateLimit);

// Public routes
router.post('/register', validateRegistration, register);
router.post('/login', limiter, validateLogin, login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware are protected

router.get('/logout', logout);
router.get('/me', getMe);
router.patch('/update-profile', updateProfile);
router.patch('/change-password', changePassword);

// Admin only routes
router.use(restrictTo('admin'));
router.get('/users', getAllUsers);

export default router;