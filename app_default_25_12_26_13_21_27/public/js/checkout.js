async function loadCheckout() {
    if (!isLoggedIn()) {
        requireAuth();
        return;
    }

    try {
        const data = await apiCall('/cart');
        const cartItems = data.cartItems;

        if (cartItems.length === 0) {
            alert('Your cart is empty');
            window.location.href = '/cart';
            return;
        }

        displayOrderItems(cartItems);
        updateOrderSummary(cartItems);
    } catch (error) {
        console.error('Failed to load checkout:', error);
        showNotification('Failed to load checkout', 'error');
    }
}

function displayOrderItems(cartItems) {
    const container = document.getElementById('orderItems');

    container.innerHTML = cartItems.map(item => `
        <div class="order-item">
            <span>${item.name} (x${item.quantity})</span>
            <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
    `).join('');
}

function updateOrderSummary(cartItems) {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 10;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    document.getElementById('summarySubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('summaryShipping').textContent = formatCurrency(shipping);
    document.getElementById('summaryTax').textContent = formatCurrency(tax);
    document.getElementById('summaryTotal').textContent = formatCurrency(total);
}

async function submitOrder(event) {
    event.preventDefault();

    if (!isLoggedIn()) {
        goToLogin();
        return;
    }

    try {
        const orderData = {
            shippingAddress: document.getElementById('shippingAddress').value,
            shippingCity: document.getElementById('shippingCity').value,
            shippingZip: document.getElementById('shippingZip').value,
            paymentMethod: document.getElementById('paymentMethod').value
        };

        const response = await apiCall('/orders/create', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        showNotification('Order placed successfully!', 'success');
        setTimeout(() => {
            window.location.href = `/dashboard`;
        }, 1500);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCheckout();
});
