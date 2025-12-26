const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Add review
router.post('/add', verifyToken, [
  body('productId').isInt(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { productId, rating, comment } = req.body;
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    // Check if product exists
    const [products] = await connection.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if user already reviewed
    const [existingReview] = await connection.query(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      [productId, userId]
    );

    if (existingReview.length > 0) {
      // Update review
      await connection.query(
        'UPDATE reviews SET rating = ?, comment = ? WHERE product_id = ? AND user_id = ?',
        [rating, comment, productId, userId]
      );
    } else {
      // Add new review
      await connection.query(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [productId, userId, rating, comment]
      );
    }

    connection.release();
    res.json({ success: true, message: 'Review submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
});

// Get product reviews
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = global.db;
    const connection = await pool.getConnection();

    const [reviews] = await connection.query(
      `SELECT r.*, u.name as user_name FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? 
       ORDER BY r.created_at DESC`,
      [id]
    );

    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    connection.release();
    res.json({ success: true, reviews, averageRating: avgRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

module.exports = router;
