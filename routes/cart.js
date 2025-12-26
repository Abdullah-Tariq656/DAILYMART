const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Add to cart
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    // Check if product exists and has stock
    const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (products[0].stock < quantity) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    // Check if item exists in cart
    const [existingCart] = await connection.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existingCart.length > 0) {
      // Update quantity
      await connection.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, userId, productId]
      );
    } else {
      // Add new item
      await connection.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
    }

    connection.release();
    res.json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

// Get cart
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    const [cartItems] = await connection.query(
      `SELECT c.*, p.name, p.price, p.image FROM cart_items c 
       JOIN products p ON c.product_id = p.id 
       WHERE c.user_id = ?`,
      [userId]
    );

    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    connection.release();
    res.json({ success: true, cartItems, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
});

// Update cart item
router.put('/update/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    // Verify item belongs to user
    const [cartItems] = await connection.query(
      'SELECT * FROM cart_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (cartItems.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (quantity <= 0) {
      // Delete item
      await connection.query('DELETE FROM cart_items WHERE id = ?', [id]);
    } else {
      // Update quantity
      await connection.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);
    }

    connection.release();
    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

// Remove from cart
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    await connection.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    connection.release();
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

// Clear cart
router.delete('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const pool = global.db;
    const connection = await pool.getConnection();

    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    connection.release();
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

module.exports = router;
