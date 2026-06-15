const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login — Admin login
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Simple password comparison (not hashed in env for simplicity)
    if (password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { role: 'admin', loginAt: Date.now() },
      process.env.JWT_SECRET || 'vegbot_default_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      expiresIn: '7 days',
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/verify — Verify token validity
 */
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

/**
 * POST /api/auth/change-password — Change admin password
 */
router.post('/change-password', authMiddleware, (req, res) => {
  // In production, this would update a hashed password in the database.
  // For this simple setup, the password is in .env and must be changed manually.
  res.json({
    message: 'Password change requires updating ADMIN_PASSWORD in .env file and restarting the server.',
  });
});

module.exports = router;
