async function loadAdminDashboard() {
    if (!requireAdmin()) return;

    try {
        const stats = await apiCall('/admin/statistics');
        displayStatistics(stats.statistics);
        loadProducts();
        loadOrders();
        loadUsers();
    } catch (error) {
        console.error('Failed to load admin dashboard:', error);
        showNotification('Failed to load dashboard', 'error');
    }
}

function displayStatistics(stats) {
    document.getElementById('statUsers').textContent = stats.totalUsers;
    document.getElementById('statProducts').textContent = stats.totalProducts;
    document.getElementById('statOrders').textContent = stats.totalOrders;
    document.getElementById('statRevenue').textContent = formatCurrency(stats.totalRevenue);
}

async function loadProducts() {
    try {
        const data = await apiCall('/admin/products');
        const tbody = document.getElementById('productsTable');

        if (data.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = data.products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${formatCurrency(product.price)}</td>
                <td>${product.stock}</td>
                <td>${product.category_name || 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editProduct(${product.id})">Edit</button>
                        <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

async function loadOrders() {
    try {
        const data = await apiCall('/admin/orders');
        const tbody = document.getElementById('ordersTable');

        if (data.orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No orders found</td></tr>';
            return;
        }

        tbody.innerHTML = data.orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user_name}</td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>
                    <select onchange="updateOrderStatus(${order.id}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td><button class="btn-edit" onclick="viewOrder(${order.id})">View</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

async function loadUsers() {
    try {
        const data = await apiCall('/admin/users');
        const tbody = document.getElementById('usersTable');

        if (data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = data.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td><span style="background: ${user.role === 'admin' ? '#4CAF50' : '#2196F3'}; color: white; padding: 2px 8px; border-radius: 3px;">${user.role}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function loadCategories() {
    try {
        const data = await apiCall('/admin/categories');
        const select = document.getElementById('newProductCategory');
        
        select.innerHTML = data.categories.map(cat => `
            <option value="${cat.id}">${cat.name}</option>
        `).join('');
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.admin-menu button').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function openAddProductForm() {
    loadCategories();
    document.getElementById('addProductForm').style.display = 'flex';
}

function closeAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
}

async function submitAddProduct(event) {
    event.preventDefault();

    try {
        await apiCall('/admin/products/add', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('newProductName').value,
                description: document.getElementById('newProductDesc').value,
                price: parseFloat(document.getElementById('newProductPrice').value),
                stock: parseInt(document.getElementById('newProductStock').value),
                categoryId: parseInt(document.getElementById('newProductCategory').value),
                image: document.getElementById('newProductImage').value
            })
        });

        showNotification('Product added successfully!', 'success');
        closeAddProductForm();
        loadProducts();
        event.target.reset();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await apiCall(`/admin/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        showNotification('Order status updated!', 'success');
        loadOrders();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        await apiCall(`/admin/products/${productId}`, {
            method: 'DELETE'
        });

        showNotification('Product deleted successfully!', 'success');
        loadProducts();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function editProduct(productId) {
    alert('Edit functionality - Product ID: ' + productId);
}

function viewOrder(orderId) {
    alert('Order details - Order ID: ' + orderId);
}

function logoutAdmin() {
    logout();
}

document.addEventListener('DOMContentLoaded', () => {
    loadAdminDashboard();
});
