// Authentication helpers
function getToken() {
    return localStorage.getItem('token');
}

function getUserData() {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
}

function setUserData(user, token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
}

function clearUserData() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function isLoggedIn() {
    return !!getToken();
}

function isAdmin() {
    const user = getUserData();
    return user && user.role === 'admin';
}

// Navigation helpers
function goToLogin() {
    window.location.href = '/login';
}

function goToRegister() {
    window.location.href = '/register';
}

function goToCart() {
    window.location.href = '/cart';
}

function logout() {
    clearUserData();
    window.location.href = '/';
}

function logoutAdmin() {
    clearUserData();
    window.location.href = '/admin-dashboard';
}

// API helpers
async function apiCall(endpoint, options = {}) {
    const url = `/api${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (isLoggedIn()) {
        headers['Authorization'] = `Bearer ${getToken()}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API Error');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Update cart count
async function updateCartCount() {
    if (!isLoggedIn()) {
        document.querySelectorAll('.cart-count').forEach(el => el.textContent = '0');
        return;
    }

    try {
        const data = await apiCall('/cart');
        const count = data.cartItems.length;
        document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
    } catch (error) {
        console.error('Failed to update cart count:', error);
    }
}

// Update navigation based on auth status
function updateNavigation() {
    const navActions = document.getElementById('navActions');
    if (!navActions) return;

    if (isLoggedIn()) {
        const user = getUserData();
        let html = `<span style="color: #666;">Hello, ${user.name}</span>`;
        
        if (user.role === 'admin') {
            html += `<a href="/admin-dashboard" class="btn-secondary">Admin Panel</a>`;
        }
        
        html += `<a href="/dashboard" class="btn-secondary">Dashboard</a>
                 <button class="btn-secondary" onclick="logout()">Logout</button>`;
        
        navActions.innerHTML = html;
    } else {
        navActions.innerHTML = `
            <button class="btn-secondary" onclick="goToLogin()">Login</button>
            <button class="btn-primary" onclick="goToRegister()">Register</button>
        `;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">×</button>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        background: ${type === 'success' ? '#4CAF50' : '#ff6b6b'};
        color: white;
        z-index: 10000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
    updateCartCount();

    // Add hamburger menu functionality
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });
    }
});

// Redirect to login if not authenticated
function requireAuth() {
    if (!isLoggedIn()) {
        goToLogin();
        return false;
    }
    return true;
}

// Redirect admin pages to login if not admin
function requireAdmin() {
    if (!isLoggedIn() || !isAdmin()) {
        alert('Admin access required');
        window.location.href = '/';
        return false;
    }
    return true;
}
