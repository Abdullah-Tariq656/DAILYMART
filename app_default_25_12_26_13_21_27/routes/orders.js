const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Create order
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { shippingAddress, shippingCity, shippingZip, paymentMethod } = req.body;
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    // Get cart items
    const [cartItems] = await connection.query(
      `SELECT c.*, p.price FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, shipping_address, shipping_city, shipping_zip, payment_method, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, totalAmount, shippingAddress, shippingCity, shippingZip, paymentMethod, 'pending']
    );

    const orderId = orderResult.insertId;

    // Add order items
    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) 
         VALUES (?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Update product stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    connection.release();
    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully',
      orderId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Get user orders
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    const [orders] = await connection.query(
      `SELECT o.*, 
       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count 
       FROM orders o 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`,
      [userId]
    );

    connection.release();
    res.json({ success: true, orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Get order details
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    const [orders] = await connection.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (orders.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const [orderItems] = await connection.query(
      `SELECT oi.*, p.name, p.image FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [id]
    );

    connection.release();
    res.json({ success: true, order: orders[0], items: orderItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

module.exports = router;
