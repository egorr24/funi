const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authenticateToken, generateTokens } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    const { username, email, password, displayName } = req.body;

    // Validation
    if (!username || !email || !password) {
      console.log('Missing required fields:', { username, email, password: '***' });
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    console.log('Checking if user exists...');
    const existingUser = await User.findByEmail(email) || await User.findByUsername(username);
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    // Create user - pass name field (not displayName) to match Prisma schema
    console.log('Creating user with:', { name: displayName || username, email });
    const user = await User.create({
      name: displayName || username,
      email,
      password
    });
    console.log('User created:', user);

    // Generate tokens
    const tokens = generateTokens(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      ...tokens
    });
  } catch (error) {
    console.error('Registration error full:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    console.log('Finding user by email:', email);
    const user = await User.findByEmail(email);
    console.log('User found:', user ? 'yes' : 'no');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    console.log('Verifying password...');
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    console.log('Password valid:', isValidPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update status to online
    await User.updateStatus(user.id, 'online');

    // Generate tokens
    const tokens = generateTokens(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: 'online'
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      status: req.user.status
    }
  });
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const updatedUser = await User.updateProfile(req.user.id, { displayName, avatarUrl });
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        displayName: updatedUser.display_name,
        avatarUrl: updatedUser.avatar_url
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await User.updateStatus(req.user.id, 'offline');
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const tokens = generateTokens(decoded.userId);

    res.json(tokens);
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

module.exports = router;
