const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'verix_ai_secret_key_123_456_789';

// Generate JWT Helper
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, provider: user.provider },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST api/auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user
    user = new User({
      firstName,
      lastName,
      email,
      password,
      provider: 'local'
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        provider: user.provider
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   POST api/auth/signin
// @desc    Authenticate user & get token
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.provider !== 'local') {
      return res.status(400).json({ 
        message: `This account uses ${user.provider} authentication. Please sign in using ${user.provider}.` 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        provider: user.provider
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signin' });
  }
});

// @route   POST api/auth/social-login
// @desc    Login or register via Google/GitHub
router.post('/social-login', async (req, res) => {
  const { email, firstName, lastName, provider } = req.body;

  try {
    if (!email || !firstName || !lastName || !provider) {
      return res.status(400).json({ message: 'Missing fields for social login' });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, but signed up with a different provider, we still sign them in (standard behavior)
      // but we update the provider if desired, or keep original. We'll keep original.
    } else {
      // Create a new social user
      user = new User({
        firstName,
        lastName,
        email,
        provider
      });
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        provider: user.provider
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during social login' });
  }
});

// @route   POST api/auth/google-login
// @desc    Verify Google access token and authenticate user
router.post('/google-login', async (req, res) => {
  const { accessToken } = req.body;

  try {
    if (!accessToken) {
      return res.status(400).json({ message: 'Google access token is required' });
    }

    const axios = require('axios');
    // Verify token by querying Google UserInfo API
    const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const { email, given_name, family_name } = googleRes.data;

    if (!email) {
      return res.status(400).json({ message: 'Failed to retrieve email from Google' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        firstName: given_name || 'Google',
        lastName: family_name || 'User',
        email,
        provider: 'google'
      });
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        provider: user.provider
      }
    });
  } catch (err) {
    console.error('Google verification error:', err.response ? err.response.data : err.message);
    res.status(400).json({ message: 'Invalid Google token or verification failed' });
  }
});

module.exports = router;
