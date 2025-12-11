import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Location - GeoJSON format
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length === 2 && 
                 arr[0] >= -180 && arr[0] <= 180 && // longitude
                 arr[1] >= -90 && arr[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. longitude: [-180, 180], latitude: [-90, 90]'
      }
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    }
  },
  
  // Images
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail_url: {
      type: String
    },
    width: Number,
    height: Number,
    format: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Streetlight Details
  lightCondition: {
    type: String,
    enum: {
      values: ['working', 'not_working', 'flickering', 'broken_pole', 'damaged_head', 'partial_fault'],
      message: 'Light condition must be one of: working, not_working, flickering, broken_pole, damaged_head, partial_fault'
    },
    required: true,
    default: 'not_working'
  },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  poleNumber: {
    type: String,
    trim: true
  },
  
  // Status & Workflow
  status: {
    type: String,
    enum: ['pending', 'under_review', 'assigned', 'in_progress', 'resolved', 'verified', 'closed', 'rejected'],
    default: 'pending'
  },
  
  // AI Analysis
  aiAnalysis: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    detectedCondition: String,
    processingTime: Number,
    modelVersion: String,
    analyzedAt: Date,
    notes: String
  },
  
  // Duplicate Detection
  isDuplicate: {
    type: Boolean,
    default: false
  },
  
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  },
  
  duplicateCount: {
    type: Number,
    default: 0
  },
  
  // Manual Review
  requiresReview: {
    type: Boolean,
    default: false
  },
  
  reviewNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  
  // Resolution
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String,
  fixProofImages: [{
    public_id: String,
    url: String,
    uploadedAt: Date
  }],
  
  // Verification
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  
  // User Information
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timestamps
  estimatedResolutionTime: Date,
  actualResolutionTime: Date,
  
  // Statistics
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  source: {
    type: String,
    enum: ['web', 'mobile', 'api'],
    default: 'web'
  },
  
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  },
  
  ipAddress: String
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ====================== INDEXES ======================
reportSchema.index({ location: '2dsphere' }); // For geospatial queries
reportSchema.index({ status: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ assignedTo: 1 });
reportSchema.index({ lightCondition: 1 });
reportSchema.index({ severity: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ city: 1 });
reportSchema.index({ isDuplicate: 1 });
reportSchema.index({ requiresReview: 1 });

// ====================== VIRTUAL PROPERTIES ======================
reportSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

reportSchema.virtual('isResolved').get(function() {
  return ['resolved', 'verified', 'closed'].includes(this.status);
});

reportSchema.virtual('isActive').get(function() {
  return ['pending', 'under_review', 'assigned', 'in_progress'].includes(this.status);
});

reportSchema.virtual('hasImages').get(function() {
  return this.images && this.images.length > 0;
});

// ====================== INSTANCE METHODS ======================

// Get location as object
reportSchema.methods.getLocation = function() {
  return {
    type: this.location.type,
    coordinates: this.location.coordinates,
    address: this.location.address,
    city: this.location.city,
    pincode: this.location.pincode
  };
};

// Get formatted address
reportSchema.methods.getFormattedAddress = function() {
  const parts = [];
  if (this.location.address) parts.push(this.location.address);
  if (this.location.city) parts.push(this.location.city);
  if (this.location.pincode) parts.push(this.location.pincode);
  return parts.join(', ');
};

// Add image
reportSchema.methods.addImage = function(imageData) {
  this.images.push(imageData);
  return this.save();
};

// Update status
reportSchema.methods.updateStatus = function(newStatus, userId, notes = '') {
  this.status = newStatus;
  
  // Set timestamps based on status
  switch(newStatus) {
    case 'assigned':
      this.assignedTo = userId;
      this.assignedAt = new Date();
      break;
    case 'in_progress':
      // No specific timestamp for in_progress
      break;
    case 'resolved':
      this.resolvedBy = userId;
      this.resolvedAt = new Date();
      this.resolutionNotes = notes;
      break;
    case 'verified':
      this.verifiedBy = userId;
      this.verifiedAt = new Date();
      break;
    case 'closed':
      this.actualResolutionTime = new Date();
      break;
    case 'rejected':
      this.reviewedBy = userId;
      this.reviewedAt = new Date();
      this.reviewNotes = notes;
      break;
  }
  
  return this.save();
};

// Check if report is near location
reportSchema.methods.isNear = function(lat, lng, radiusMeters = 50) {
  const earthRadius = 6371000; // meters
  
  const [lng1, lat1] = this.location.coordinates;
  const lat2 = lat * Math.PI / 180;
  const lng2 = lng * Math.PI / 180;
  
  const dLat = (lat2 - lat1 * Math.PI / 180);
  const dLon = (lng2 - lng1 * Math.PI / 180);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = earthRadius * c;
  
  return distance <= radiusMeters;
};

// ====================== STATIC METHODS ======================

// Find reports by status
reportSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort('-createdAt');
};

// Find reports by user
reportSchema.statics.findByUser = function(userId) {
  return this.find({ reportedBy: userId }).sort('-createdAt');
};

// Find reports near location
reportSchema.statics.findNear = function(lat, lng, radiusMeters = 1000, limit = 50) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radiusMeters
      }
    }
  }).limit(limit);
};

// Get statistics
reportSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        byStatus: { $push: { status: '$_id', count: '$count' } }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        byStatus: 1,
        pending: {
          $arrayElemAt: [
            { $filter: {
              input: '$byStatus',
              as: 'item',
              cond: { $eq: ['$$item.status', 'pending'] }
            }},
            0
          ]
        },
        resolved: {
          $arrayElemAt: [
            { $filter: {
              input: '$byStatus',
              as: 'item',
              cond: { $eq: ['$$item.status', 'resolved'] }
            }},
            0
          ]
        }
      }
    }
  ]);
  
  return stats[0] || { total: 0, byStatus: [] };
};

// Get daily report count
reportSchema.statics.getDailyStats = async function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 },
        resolved: {
          $sum: { $cond: [{ $in: ['$status', ['resolved', 'verified', 'closed']] }, 1, 0] }
        }
      }
    },
    {
      $sort: { _id: 1 }
    },
    {
      $project: {
        date: '$_id',
        count: 1,
        resolved: 1,
        pending: { $subtract: ['$count', '$resolved'] },
        _id: 0
      }
    }
  ]);
};

// ====================== MIDDLEWARE ======================

// Increment user's report count
reportSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(this.reportedBy, {
        $inc: { reportsSubmitted: 1 }
      });
    } catch (error) {
      console.error('Error updating user report count:', error);
    }
  }
  next();
});

// Create the model
const Report = mongoose.model('Report', reportSchema);

export default Report;