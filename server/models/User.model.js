import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    // Personal Information
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
      validate: {
        validator: function(v) {
          return /^[a-zA-Z\s]*$/.test(v);
        },
        message: 'Name can only contain letters and spaces'
      }
    },
    
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email address'
      },
      index: true
    },
    
    phone: {
      type: String,
      required: [true, 'Please provide your phone number'],
      validate: {
        validator: function(v) {
          return /^[0-9]{10}$/.test(v);
        },
        message: 'Phone number must be 10 digits'
      }
    },
    
    // Authentication
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords do not match'
      }
    },
    
    // Role Management
    role: {
      type: String,
      enum: {
        values: ['citizen', 'worker', 'admin'],
        message: 'Role must be either citizen, worker, or admin'
      },
      default: 'citizen'
    },
    
    // Account Status
    isActive: {
      type: Boolean,
      default: true
    },
    
    isVerified: {
      type: Boolean,
      default: false
    },
    
    isBlocked: {
      type: Boolean,
      default: false
    },
    
    // Profile
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    
    profileImage: {
      type: String,
      default: 'default-profile.png'
    },
    
    // Location (for workers)
    assignedZone: {
      type: String,
      default: null
    },
    
    // Statistics
    reportsSubmitted: {
      type: Number,
      default: 0
    },
    
    reportsResolved: {
      type: Number,
      default: 0
    },
    
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    
    // Timestamps
    lastLogin: {
      type: Date
    },
    
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Login attempts
    loginAttempts: {
      type: Number,
      default: 0
    },
    
    lockUntil: Date
    
  }, 
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: function(doc, ret) {
      // Remove sensitive data from JSON output
      delete ret.password;
      delete ret.passwordConfirm;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }},
    toObject: { virtuals: true }
  }
);

// ====================== INDEXES ======================
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// ====================== VIRTUAL PROPERTIES ======================
userSchema.virtual('fullName').get(function() {
  return this.name;
});

userSchema.virtual('status').get(function() {
  if (this.isBlocked) return 'blocked';
  if (!this.isActive) return 'inactive';
  if (!this.isVerified) return 'unverified';
  return 'active';
});

userSchema.virtual('isAccountLocked').get(function() {
  return this.lockUntil && this.lockUntil > Date.now();
});

// ====================== MIDDLEWARE ======================

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only run if password was modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost factor 12
    this.password = await bcrypt.hash(this.password, 12);
    
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    
    // Update passwordChangedAt timestamp
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // 1 second ago
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastLogin on successful login
userSchema.pre('findOneAndUpdate', function(next) {
  if (this._update.lastLogin) {
    this._update.lastLogin = new Date();
  }
  next();
});

// ====================== INSTANCE METHODS ======================

// Compare password
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Increment attempts
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 1 hour
  if (this.loginAttempts + 1 >= 5 && !this.isBlocked) {
    updates.$set = { lockUntil: Date.now() + 60 * 60 * 1000 }; // 1 hour
  }
  
  return this.updateOne(updates);
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// ====================== STATIC METHODS ======================

// Find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true, isBlocked: false });
};

// Find by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true, isBlocked: false });
};

// Get user stats
userSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { 
          $sum: { 
            $cond: [{ $and: [{ $eq: ['$isActive', true] }, { $eq: ['$isBlocked', false] }] }, 1, 0] 
          }
        }
      }
    },
    {
      $project: {
        role: '$_id',
        total: '$count',
        active: '$active',
        _id: 0
      }
    }
  ]);
  
  return stats;
};

// ====================== QUERY HELPERS ======================

// Query helper to exclude blocked/inactive users
userSchema.query.active = function() {
  return this.where({ isActive: true, isBlocked: false });
};

// Query helper for verified users
userSchema.query.verified = function() {
  return this.where({ isVerified: true });
};

// Create the model
const User = mongoose.model('User', userSchema);

export default User;