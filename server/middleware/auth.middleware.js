import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { extractToken } from '../utils/auth.utils.js';

/**
 * Protect routes - require authentication
 */
export const protect = async (req, res, next) => {
  try {
    // 1) Get token
    const token = extractToken(req.headers);
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.'
      });
    }
    
    // 2) Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token. Please log in again.'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Your token has expired. Please log in again.'
        });
      }
      
      throw error;
    }
    
    // 3) Check if user still exists
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    // 4) Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'User recently changed password. Please log in again.'
      });
    }
    
    // 5) Check if user is active
    if (!user.isActive || user.isBlocked) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }
    
    // 6) Grant access
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Restrict to specific roles
 * @param {...string} roles - Allowed roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.'
      });
    }
    
    next();
  };
};

/**
 * Check if user is authenticated (optional)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive && !user.isBlocked) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

/**
 * Rate limiting for auth routes
 */
export const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
};

/**
 * Validate registration data
 */
export const validateRegistration = (req, res, next) => {
  const { name, email, password, passwordConfirm, phone, role } = req.body;
  const errors = [];
  
  // Check required fields
  if (!name || !email || !password || !passwordConfirm || !phone) {
    errors.push('All fields are required');
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push('Please provide a valid email address');
  }
  
  // Validate phone
  const phoneRegex = /^[0-9]{10}$/;
  if (phone && !phoneRegex.test(phone)) {
    errors.push('Phone number must be 10 digits');
  }
  
  // Validate password length
  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  // Check password match
  if (password && passwordConfirm && password !== passwordConfirm) {
    errors.push('Passwords do not match');
  }
  
  // Validate role
  const validRoles = ['citizen', 'worker', 'admin'];
  if (role && !validRoles.includes(role)) {
    errors.push('Invalid role specified');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

/**
 * Validate login data
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];
  
  if (!email || !password) {
    errors.push('Please provide email and password');
  }
  
  if (email && !email.includes('@')) {
    errors.push('Please provide a valid email');
  }
  
  if (password && password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};