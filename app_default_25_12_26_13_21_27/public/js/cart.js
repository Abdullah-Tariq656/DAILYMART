async function loadCart() {
    if (!isLoggedIn()) {
        requireAuth();
        return;
    }

    try {
        const data = await apiCall('/cart');
        const cartItems = data.cartItems;

        if (cartItems.length === 0) {
            document.getElementById('emptyCart').style.display = 'block';
            document.getElementById('cartItemsList').style.display = 'none';
            document.getElementById('checkoutBtn').disabled = true;
        } else {
            document.getElementById('emptyCart').style.display = 'none';
            document.getElementById('cartItemsList').style.display = 'block';
            document.getElementById('checkoutBtn').disabled = false;
            displayCartItems(cartItems);
        }

        updateCartSummary(cartItems);
    } catch (error) {
        console.error('Failed to load cart:', error);
        showNotification('Failed to load cart', 'error');
    }
}

function displayCartItems(cartItems) {
    const container = document.getElementById('cartItemsList');

    container.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image || 'https://via.placeholder.com/100'}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>${formatCurrency(item.price)} each</p>
            </div>
            <div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" readonly>
                    <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
                <p style="text-align: center; margin-top: 0.5rem;">${formatCurrency(item.price * item.quantity)}</p>
                <button class="btn-secondary" onclick="removeFromCart(${item.id})" style="width: 100%; margin-top: 0.5rem;">Remove</button>
            </div>
        </div>
    `).join('');
}

function updateCartSummary(cartItems) {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 10 : 0;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('shipping').textContent = formatCurrency(shipping);
    document.getElementById('tax').textContent = formatCurrency(tax);
    document.getElementById('total').textContent = formatCurrency(total);
}

async function updateQuantity(cartItemId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(cartItemId);
        return;
    }

    try {
        await apiCall(`/cart/update/${cartItemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity: newQuantity })
        });

        loadCart();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function removeFromCart(cartItemId) {
    if (!confirm('Remove this item from cart?')) return;

    try {
        await apiCall(`/cart/${cartItemId}`, {
            method: 'DELETE'
        });

        updateCartCount();
        loadCart();
        showNotification('Item removed from cart', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function proceedToCheckout() {
    if (!isLoggedIn()) {
        goToLogin();
        return;
    }

    window.location.href = '/checkout';
}

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});
