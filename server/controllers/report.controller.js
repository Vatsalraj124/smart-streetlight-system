import Report from '../models/Report.model.js';
import User from '../models/User.model.js';
import { 
  validateCoordinates, 
  isWithinCity, 
  generateGeoJSON,
  reverseGeocode 
} from '../utils/location.utils.js';
import { 
  uploadToCloudinary, 
  validateImageQuality,
  deleteFromCloudinary 
} from '../utils/imageUpload.utils.js';
import fs from 'fs';
import path from 'path';

/**
 * @desc    Create a new report
 * @route   POST /api/reports
 * @access  Private
 */
export const createReport = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      latitude, 
      longitude, 
      lightCondition, 
      severity,
      poleNumber,
      address,
      city,
      pincode
    } = req.body;

    // Validate required fields
    if (!title || !latitude || !longitude || !lightCondition) {
      return res.status(400).json({
        status: 'error',
        message: 'Title, location coordinates, and light condition are required'
      });
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(parseFloat(latitude), parseFloat(longitude));
    if (!coordValidation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: coordValidation.error
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Check if location is within service area
    if (city && !isWithinCity(lat, lng, city)) {
      return res.status(400).json({
        status: 'error',
        message: 'Location is outside our service area'
      });
    }

    // Process images if uploaded
    let images = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Validate image quality
          const qualityCheck = await validateImageQuality(file.path);
          
          if (qualityCheck.hasWarnings) {
            console.log('Image quality warnings:', qualityCheck.warnings);
          }

          // Upload to Cloudinary
          const uploadResult = await uploadToCloudinary(file.path);
          
          images.push({
            public_id: uploadResult.public_id,
            url: uploadResult.url,
            thumbnail_url: uploadResult.thumbnail_url,
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format,
            qualityCheck: {
              warnings: qualityCheck.warnings,
              brightness: qualityCheck.validations.brightness?.brightness,
              resolution: qualityCheck.validations.blur?.resolution
            }
          });

          // Clean up local file
          fs.unlinkSync(file.path);

        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          // Continue with other images even if one fails
        }
      }
    }

    // Reverse geocode if address not provided
    let locationAddress = address;
    let locationCity = city;
    let locationPincode = pincode;

    if (!address || !city) {
      try {
        const geocodeResult = await reverseGeocode(lat, lng);
        if (geocodeResult) {
          locationAddress = locationAddress || geocodeResult.formatted;
          locationCity = locationCity || geocodeResult.components.city;
          locationPincode = locationPincode || geocodeResult.components.pincode;
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
      }
    }

    // Generate GeoJSON location
    const geoJSON = generateGeoJSON(lat, lng, {
      formatted: locationAddress,
      components: {
        city: locationCity,
        pincode: locationPincode
      }
    });

    // Create report
    const report = await Report.create({
      title,
      description,
      location: geoJSON,
      lightCondition,
      severity: severity || 'medium',
      poleNumber,
      images,
      reportedBy: req.user.id,
      deviceInfo: {
        browser: req.headers['user-agent'],
        os: req.headers['sec-ch-ua-platform'],
        device: req.headers['sec-ch-ua-mobile'] === '?1' ? 'mobile' : 'desktop'
      },
      ipAddress: req.ip
    });

    // Check for nearby duplicates
    const duplicateRadius = 50; // meters
    const nearbyReports = await Report.findNear(lat, lng, duplicateRadius, 5);
    
    if (nearbyReports.length > 0) {
      report.isDuplicate = true;
      report.duplicateOf = nearbyReports[0]._id;
      report.duplicateCount = nearbyReports.length;
      await report.save();

      // Increment duplicate count on original report
      await Report.findByIdAndUpdate(nearbyReports[0]._id, {
        $inc: { duplicateCount: 1 }
      });
    }

    // Determine if manual review is needed
    if (images.length === 0 || 
        images.some(img => img.qualityCheck?.warnings?.length > 0) ||
        severity === 'critical') {
      report.requiresReview = true;
      report.status = 'under_review';
      await report.save();
    }

    // Populate user info
    await report.populate('reportedBy', 'name email phone');

    res.status(201).json({
      status: 'success',
      message: 'Report created successfully',
      data: {
        report,
        warnings: report.requiresReview ? 
          'Report requires manual review' : null,
        duplicateInfo: report.isDuplicate ? 
          `Similar report found nearby (${report.duplicateCount} reports)` : null
      }
    });

  } catch (error) {
    console.error('Create report error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Get all reports (with pagination and filters)
 * @route   GET /api/reports
 * @access  Private
 */
export const getAllReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      lightCondition,
      severity,
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (lightCondition) query.lightCondition = lightCondition;
    if (severity) query.severity = severity;
    if (city) query['location.city'] = city;

    // Search in title and description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // For citizens, only show their reports
    if (req.user.role === 'citizen') {
      query.reportedBy = req.user.id;
    }

    // For workers, show assigned reports
    if (req.user.role === 'worker') {
      query.$or = [
        { status: { $in: ['assigned', 'in_progress'] } },
        { assignedTo: req.user.id }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query
    const reports = await Report.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    // Get total count
    const total = await Report.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Add stats for admin
    let stats = null;
    if (req.user.role === 'admin') {
      stats = await Report.getStatistics();
    }

    res.status(200).json({
      status: 'success',
      results: reports.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      data: {
        reports,
        ...(stats && { stats })
      }
    });

  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Get single report
 * @route   GET /api/reports/:id
 * @access  Private
 */
export const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('assignedTo', 'name email phone')
      .populate('resolvedBy', 'name email')
      .populate('verifiedBy', 'name email')
      .populate('duplicateOf', 'title status');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Check permissions
    if (req.user.role === 'citizen' && report.reportedBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this report'
      });
    }

    // Increment view count
    report.viewCount += 1;
    await report.save();

    res.status(200).json({
      status: 'success',
      data: {
        report
      }
    });

  } catch (error) {
    console.error('Get report error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Update report
 * @route   PATCH /api/reports/:id
 * @access  Private
 */
export const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Check permissions
    if (req.user.role === 'citizen' && report.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this report'
      });
    }

    // Allowed updates based on role
    const allowedUpdates = {};
    
    if (req.user.role === 'citizen') {
      // Citizens can only update title and description
      if (req.body.title) allowedUpdates.title = req.body.title;
      if (req.body.description) allowedUpdates.description = req.body.description;
    } else if (req.user.role === 'worker') {
      // Workers can update status and add notes
      if (req.body.status && ['in_progress', 'resolved'].includes(req.body.status)) {
        allowedUpdates.status = req.body.status;
        
        if (req.body.status === 'resolved') {
          allowedUpdates.resolvedBy = req.user.id;
          allowedUpdates.resolvedAt = new Date();
          allowedUpdates.resolutionNotes = req.body.resolutionNotes;
        }
      }
    } else if (req.user.role === 'admin') {
      // Admin can update anything except reportedBy
      const { reportedBy, ...updates } = req.body;
      Object.assign(allowedUpdates, updates);
    }

    // Update report
    Object.assign(report, allowedUpdates);
    await report.save();

    res.status(200).json({
      status: 'success',
      message: 'Report updated successfully',
      data: {
        report
      }
    });

  } catch (error) {
    console.error('Update report error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Delete report
 * @route   DELETE /api/reports/:id
 * @access  Private/Admin
 */
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Delete images from Cloudinary
    if (report.images && report.images.length > 0) {
      for (const image of report.images) {
        await deleteFromCloudinary(image.public_id);
      }
    }

    // Delete fix proof images
    if (report.fixProofImages && report.fixProofImages.length > 0) {
      for (const image of report.fixProofImages) {
        await deleteFromCloudinary(image.public_id);
      }
    }

    // Delete report
    await report.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Get reports near location
 * @route   GET /api/reports/nearby
 * @access  Public
 */
export const getNearbyReports = async (req, res) => {
  try {
    const { lat, lng, radius = 1000, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    const reports = await Report.findNear(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(radius),
      parseInt(limit)
    )
    .select('title lightCondition status location createdAt')
    .populate('reportedBy', 'name')
    .lean();

    res.status(200).json({
      status: 'success',
      results: reports.length,
      data: {
        reports
      }
    });

  } catch (error) {
    console.error('Get nearby reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Get report statistics
 * @route   GET /api/reports/stats
 * @access  Private/Admin
 */
export const getReportStats = async (req, res) => {
  try {
    const stats = await Report.getStatistics();
    const dailyStats = await Report.getDailyStats(7);

    // User stats
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeReports: { $sum: '$reportsSubmitted' },
          resolvedReports: { $sum: '$reportsResolved' }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        overall: stats,
        daily: dailyStats,
        users: userStats
      }
    });

  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Upload additional images to report
 * @route   POST /api/reports/:id/images
 * @access  Private
 */
export const uploadReportImages = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Check permissions
    if (req.user.role === 'citizen' && report.reportedBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to add images to this report'
      });
    }

    // Process uploaded images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images uploaded'
      });
    }

    const newImages = [];

    for (const file of req.files) {
      try {
        const uploadResult = await uploadToCloudinary(file.path);
        
        newImages.push({
          public_id: uploadResult.public_id,
          url: uploadResult.url,
          thumbnail_url: uploadResult.thumbnail_url,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format
        });

        // Clean up local file
        fs.unlinkSync(file.path);

      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
      }
    }

    // Add images to report
    report.images.push(...newImages);
    await report.save();

    res.status(200).json({
      status: 'success',
      message: 'Images uploaded successfully',
      data: {
        images: newImages,
        totalImages: report.images.length
      }
    });

  } catch (error) {
    console.error('Upload images error:', error);
    
    // Clean up files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};