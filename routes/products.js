const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Get all products with filtering
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const pool = global.db;
    const connection = await pool.getConnection();

    let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.stock > 0';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [products] = await connection.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE stock > 0';
    const countParams = [];

    if (category && category !== 'all') {
      countQuery += ' AND category_id = ?';
      countParams.push(category);
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await connection.query(countQuery, countParams);

    connection.release();
    res.json({
      success: true,
      products,
      total: countResult[0].total,
      pages: Math.ceil(countResult[0].total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = global.db;
    const connection = await pool.getConnection();

    const [products] = await connection.query(
      `SELECT p.*, c.name as category_name FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get reviews
    const [reviews] = await connection.query(
      `SELECT r.*, u.name as user_name FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.product_id = ? 
       ORDER BY r.created_at DESC`,
      [id]
    );

    connection.release();
    res.json({
      success: true,
      product: products[0],
      reviews
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// Get categories
router.get('/categories/all', async (req, res) => {
  try {
    const pool = global.db;
    const connection = await pool.getConnection();

    const [categories] = await connection.query('SELECT * FROM categories ORDER BY name ASC');

    connection.release();
    res.json({ success: true, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

module.exports = router;
