import { validateCoordinates } from '../utils/location.utils.js';

/**
 * Validate report data
 */
export const validateReport = (req, res, next) => {
  const errors = [];
  
  // Check required fields
  if (!req.body.title) {
    errors.push('Report title is required');
  }
  
  if (!req.body.latitude || !req.body.longitude) {
    errors.push('Location coordinates are required');
  }
  
  if (!req.body.lightCondition) {
    errors.push('Light condition is required');
  }
  
  // Validate coordinates
  if (req.body.latitude && req.body.longitude) {
    const validation = validateCoordinates(
      parseFloat(req.body.latitude),
      parseFloat(req.body.longitude)
    );
    
    if (!validation.isValid) {
      errors.push(validation.error);
    }
  }
  
  // Validate light condition
  const validConditions = ['working', 'not_working', 'flickering', 'broken_pole', 'damaged_head', 'partial_fault'];
  if (req.body.lightCondition && !validConditions.includes(req.body.lightCondition)) {
    errors.push(`Light condition must be one of: ${validConditions.join(', ')}`);
  }
  
  // Validate severity
  if (req.body.severity) {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(req.body.severity)) {
      errors.push(`Severity must be one of: ${validSeverities.join(', ')}`);
    }
  }
  
  // Validate images
  if (req.files) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    for (const file of req.files) {
      if (file.size > maxSize) {
        errors.push(`File ${file.originalname} exceeds maximum size of 5MB`);
      }
      
      if (!allowedTypes.includes(file.mimetype)) {
        errors.push(`File ${file.originalname} must be an image (JPEG, PNG, GIF, WebP)`);
      }
    }
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
 * Check report ownership
 */
export const checkReportOwnership = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    // Admin can access any report
    if (req.user.role === 'admin') {
      req.report = report;
      return next();
    }
    
    // Workers can access assigned reports
    if (req.user.role === 'worker' && report.assignedTo?.toString() === req.user.id) {
      req.report = report;
      return next();
    }
    
    // Citizens can only access their own reports
    if (report.reportedBy.toString() === req.user.id) {
      req.report = report;
      return next();
    }
    
    return res.status(403).json({
      status: 'error',
      message: 'Not authorized to access this report'
    });
    
  } catch (error) {
    console.error('Check ownership error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Validate report status transition
 */
export const validateStatusTransition = (req, res, next) => {
  const validTransitions = {
    pending: ['under_review', 'assigned', 'rejected'],
    under_review: ['pending', 'assigned', 'rejected'],
    assigned: ['in_progress', 'pending'],
    in_progress: ['resolved', 'assigned'],
    resolved: ['verified', 'in_progress'],
    verified: ['closed', 'resolved'],
    closed: [],
    rejected: ['pending']
  };
  
  if (req.body.status) {
    const currentStatus = req.report?.status || req.body.currentStatus;
    const newStatus = req.body.status;
    
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status transition from ${currentStatus} to ${newStatus}`
      });
    }
  }
  
  next();
};