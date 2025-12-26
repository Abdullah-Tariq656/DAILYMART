async function loadDashboard() {
    if (!isLoggedIn()) {
        requireAuth();
        return;
    }

    try {
        const user = await apiCall('/users/profile');
        document.getElementById('userName').textContent = user.user.name;

        const orders = await apiCall('/orders');
        loadDashboardStats(orders.orders);
        loadOrders(orders.orders);
        loadProfile(user.user);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showNotification('Failed to load dashboard', 'error');
    }
}

function loadDashboardStats(orders) {
    document.getElementById('totalOrders').textContent = orders.length;

    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);

    const completedOrders = orders.filter(order => order.status === 'completed').length;
    document.getElementById('completedOrders').textContent = completedOrders;
}

function loadOrders(orders) {
    const container = document.getElementById('ordersList');

    if (orders.length === 0) {
        container.innerHTML = '<p>No orders yet</p>';
        return;
    }

    container.innerHTML = orders.map(order => `
        <div class="order-card" onclick="viewOrderDetails(${order.id})">
            <div class="order-header">
                <span class="order-id">Order #${order.id}</span>
                <span class="order-status order-status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div>
                <p><strong>Amount:</strong> ${formatCurrency(order.total_amount)}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Shipping:</strong> ${order.shipping_city}, ${order.shipping_zip}</p>
            </div>
        </div>
    `).join('');
}

function loadProfile(user) {
    document.getElementById('profileName').value = user.name;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profilePhone').value = user.phone || '';
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all menu items
    document.querySelectorAll('.dashboard-menu button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');
}

async function updateProfile(event) {
    event.preventDefault();

    try {
        await apiCall('/users/profile', {
            method: 'PUT',
            body: JSON.stringify({
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value
            })
        });

        showNotification('Profile updated successfully!', 'success');
        loadDashboard();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function changePassword(event) {
    event.preventDefault();

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    try {
        await apiCall('/users/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword })
        });

        showNotification('Password changed successfully!', 'success');
        event.target.reset();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function viewOrderDetails(orderId) {
    alert(`Order details for order #${orderId} - Feature coming soon`);
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});
