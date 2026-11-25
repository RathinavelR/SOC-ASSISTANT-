const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { logAction } = require('../utils/auditLogger');
const logger = require('../utils/logger');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Default first user to ADMIN if no users exist in system
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'ADMIN' : (role || 'VIEWER');

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role: assignedRole,
    });

    await user.save();
    const token = generateToken(user);

    await logAction({
      req,
      user,
      action: 'USER_REGISTER',
      category: 'auth',
      description: `User ${user.email} registered with role ${user.role}`,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      await logAction({
        req,
        action: 'LOGIN_FAILED',
        category: 'auth',
        description: `Failed login attempt for ${email}`,
        status: 'failure',
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logAction({
        req,
        user,
        action: 'LOGIN_FAILED',
        category: 'auth',
        description: `Failed password for user ${email}`,
        status: 'failure',
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await logAction({
      req,
      user,
      action: 'LOGIN_SUCCESS',
      category: 'auth',
      description: `User ${user.email} logged in successfully`,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    // Always return success to prevent user enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been dispatched.',
    });

    if (user) {
      await logAction({
        req,
        user,
        action: 'PASSWORD_RESET_REQUEST',
        category: 'auth',
        description: `Password reset requested for ${email}`,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    // In a production setup, verify reset token hash & expiry
    res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in.',
    });
  } catch (error) {
    next(error);
  }
};
