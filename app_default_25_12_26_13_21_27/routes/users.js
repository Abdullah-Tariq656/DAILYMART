const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    const [users] = await connection.query('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    connection.release();
    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', verifyToken, [
  body('name').trim().notEmpty(),
  body('phone').isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone } = req.body;
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    await connection.query(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name, phone, userId]
    );

    connection.release();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', verifyToken, [
  body('oldPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { oldPassword, newPassword } = req.body;
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    const [users] = await connection.query('SELECT password FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(oldPassword, users[0].password);
    if (!validPassword) {
      connection.release();
      return res.status(401).json({ success: false, message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    connection.release();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

module.exports = router;
