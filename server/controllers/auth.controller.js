import User from '../models/User.model.js';
import { 
  generateToken, 
  getCookieOptions, 
  hashData,
  validateEmail,
  validatePassword
} from '../utils/auth.utils.js';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, phone, role, address } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }
    
    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Password validation failed',
        errors: passwordValidation.errors
      });
    }
    
    // Create new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      passwordConfirm,
      phone,
      role: role || 'citizen',
      address
    });
    
    // Generate JWT token
    const token = generateToken(newUser._id, newUser.role);
    
    // Remove password from output
    newUser.password = undefined;
    
    // Set cookie
    res.cookie('token', token, getCookieOptions());
    
    // Send response
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      token,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          isVerified: newUser.isVerified,
          createdAt: newUser.createdAt
        }
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists'
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
      message: 'Internal server error during registration'
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }
    
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }
    
    // 3) Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({
        status: 'error',
        message: `Account is locked. Try again in ${remainingTime} minutes`
      });
    }
    
    // 4) Check if password is correct
    const isPasswordCorrect = await user.correctPassword(password);
    
    if (!isPasswordCorrect) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      const attemptsLeft = 5 - (user.loginAttempts + 1);
      
      return res.status(401).json({
        status: 'error',
        message: `Incorrect email or password. ${attemptsLeft > 0 ? `${attemptsLeft} attempts remaining` : 'Account will be locked after next failed attempt'}`
      });
    }
    
    // 5) Check if user is active
    if (!user.isActive || user.isBlocked) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }
    
    // 6) Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // 7) Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // 8) Generate token
    const token = generateToken(user._id, user.role);
    
    // 9) Remove password from output
    user.password = undefined;
    user.loginAttempts = undefined;
    user.lockUntil = undefined;
    
    // 10) Set cookie
    res.cookie('token', token, getCookieOptions());
    
    // 11) Send response
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
          reportsSubmitted: user.reportsSubmitted,
          reportsResolved: user.reportsResolved
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during login'
    });
  }
};

/**
 * @desc    Logout user
 * @route   GET /api/auth/logout
 * @access  Private
 */
export const logout = (req, res) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PATCH /api/auth/update-profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    // Filter allowed fields
    const filteredBody = {};
    if (name) filteredBody.name = name;
    if (phone) filteredBody.phone = phone;
    if (address) filteredBody.address = address;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
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
 * @desc    Change password
 * @route   PATCH /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;
    
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    
    // 2) Check if current password is correct
    if (!(await user.correctPassword(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Your current password is incorrect'
      });
    }
    
    // 3) Check if new passwords match
    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({
        status: 'error',
        message: 'New passwords do not match'
      });
    }
    
    // 4) Update password
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();
    
    // 5) Generate new token
    const token = generateToken(user._id, user.role);
    
    // 6) Update cookie
    res.cookie('token', token, getCookieOptions());
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
      token
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // 1) Get user based on email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal that user doesn't exist
      return res.status(200).json({
        status: 'success',
        message: 'If your email exists in our system, you will receive a password reset link'
      });
    }
    
    // 2) Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // TODO: Send email with reset token
    // For now, we'll just return the token (in development only)
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset URL:', resetURL);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset token generated',
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetURL })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Reset token fields if error occurs
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email.toLowerCase() });
      if (user) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Reset password
 * @route   PATCH /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;
    
    // 1) Get user based on token
    const hashedToken = hashData(token);
    
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Token is invalid or has expired'
      });
    }
    
    // 2) Update password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    // 3) Generate new token
    const newToken = generateToken(user._id, user.role);
    
    // 4) Update cookie
    res.cookie('token', newToken, getCookieOptions());
    
    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
      token: newToken
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/auth/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};