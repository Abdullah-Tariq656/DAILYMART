-- Create database
CREATE DATABASE IF NOT EXISTS dailymart;
USE dailymart;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category_id INT,
  image LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_category (category_id),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart (user_id, product_id),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100),
  shipping_zip VARCHAR(20),
  payment_method VARCHAR(50),
  status ENUM('pending', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_review (product_id, user_id),
  INDEX idx_product (product_id),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES 
('Electronics', 'Electronic devices and gadgets'),
('Groceries', 'Fresh groceries and food items'),
('Clothing', 'Clothing and apparel'),
('Home & Kitchen', 'Home and kitchen products'),
('Books', 'Books and educational materials'),
('Sports', 'Sports and fitness equipment');

-- Insert sample products
INSERT INTO products (name, description, price, stock, category_id, image) VALUES 
('Laptop Pro', 'High-performance laptop for professionals', 899.99, 15, 1, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'),
('Fresh Milk', 'Pure fresh milk 1 liter', 2.99, 100, 2, 'https://images.unsplash.com/photo-1563636619-0c6015b7edd8?w=500'),
('Cotton T-Shirt', 'Comfortable cotton t-shirt', 19.99, 50, 3, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'),
('Non-Stick Pan', 'Durable non-stick cooking pan', 34.99, 30, 4, 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=500'),
('JavaScript Guide', 'Complete JavaScript programming guide', 29.99, 20, 5, 'https://images.unsplash.com/photo-1507842872343-583f20270319?w=500'),
('Yoga Mat', 'High-quality yoga mat for exercise', 24.99, 45, 6, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'),
('Wireless Mouse', 'Reliable wireless computer mouse', 15.99, 60, 1, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'),
('Whole Wheat Bread', 'Healthy whole wheat bread loaf', 3.49, 40, 2, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500'),
('Winter Jacket', 'Warm winter jacket for cold weather', 79.99, 25, 3, 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500'),
('Coffee Maker', 'Automatic coffee maker for home', 49.99, 35, 4, 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=500');

-- Insert sample admin user (password: admin123)
INSERT INTO users (name, email, password, phone, role) VALUES 
('Admin User', 'admin@dailymart.com', '$2a$10$9L1K5i5jZ5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5j5jS', '1234567890', 'admin');
