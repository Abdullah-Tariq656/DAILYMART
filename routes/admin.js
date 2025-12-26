const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Dashboard statistics
router.get('/statistics', verifyAdmin, async (req, res) => {
  try {
    const pool = global.db;
    const connection = await pool.getConnection();

    const [totalUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [totalProducts] = await connection.query('SELECT COUNT(*) as count FROM products');
    const [totalOrders] = await connection.query('SELECT COUNT(*) as count FROM orders');
    const [totalRevenue] = await connection.query('SELECT SUM(total_amount) as total FROM orders WHERE status = "completed"');
    const [pendingOrders] = await connection.query('SELECT COUNT(*) as count FROM orders WHERE status = "pending"');

    connection.release();
    res.json({
      success: true,
      statistics: {
        totalUsers: totalUsers[0].count,
        totalProducts: totalProducts[0].count,
        totalOrders: totalOrders[0].count,
        totalRevenue: totalRevenue[0].total || 0,
        pendingOrders: pendingOrders[0].count
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// Get all products
router.get('/products', verifyAdmin, async (req, res) => {
  try {
    const pool = global.db;
    const connection = await pool.getConnection();

    const [products] = await connection.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC'
    );

    connection.release();
    res.json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// Add product
router.post('/products/add', verifyAdmin, [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('categoryId').isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, price, stock, categoryId, image } = req.body;
    const pool = global.db;
    const connection = await pool.getConnection();

    await connection.query(
      `INSERT INTO products (name, description, price, stock, category_id, image) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, price, stock, categoryId, image || 'https://via.placeholder.com/300']
    );

    connection.release();
    res.status(201).json({ success: true, message: 'Product added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});

// Update product
router.put('/products/:id', verifyAdmin, [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, price, stock, categoryId, image } = req.body;
    const pool = global.db;
    const connection = await pool.getConnection();

    await connection.query(
      `UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category_id = ?, image = ? WHERE id = ?`,
      [name, description, price, stock, categoryId, image, id]
    );

    connection.release();
    res.json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/products/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = global.db;
    const connection = await pool.getConnection();

    await connection.query('DELETE FROM products WHERE id = ?', [id]);

    connection.release();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// Get all orders
router.get('/orders', verifyAdmin, async (req, res) => {
  try {
    const pool = global.db;
    const connection = await pool.getConnection();

    const [orders] = await connection.query(
      `SELECT o.*, u.name as user_name, u.email FROM orders o 
       JOIN users u ON o.user_id = u.id 
       ORDER BY o.created_at DESC`
    );

    connection.release();
    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Update order status
router.put('/orders/:id', verifyAdmin, [
  body('status').isIn(['pending', 'processing', 'shipped', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const pool = global.db;
    const connection = await pool.getConnection();

    await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    connection.release();
    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const pool = global.db;
    const connection = await pool.getConnection();

    const [users] = await connection.query(
      'SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
    );

    connection.release();
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Get categories
router.get('/categories', verifyAdmin, async (req, res) => {
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
