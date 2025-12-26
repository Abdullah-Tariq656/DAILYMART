async function loadFeaturedProducts() {
    try {
        const data = await apiCall('/products?limit=6');
        const container = document.getElementById('featuredProducts');
        
        if (data.products.length === 0) {
            container.innerHTML = '<p>No products available</p>';
            return;
        }

        container.innerHTML = data.products.map(product => `
            <div class="product-card" onclick="goToProduct(${product.id})">
                <div class="product-image">
                    <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-rating">⭐ (${product.stock > 0 ? 'In Stock' : 'Out of Stock'})</div>
                    <div class="product-actions">
                        <button class="btn-primary" onclick="handleAddToCart(event, ${product.id})">Add to Cart</button>
                        <button class="btn-secondary" onclick="goToProduct(${product.id})">View</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load featured products:', error);
        document.getElementById('featuredProducts').innerHTML = '<p>Failed to load products</p>';
    }
}

async function loadCategories() {
    try {
        const data = await apiCall('/products/categories/all');
        const container = document.getElementById('categoriesGrid');
        
        if (data.categories.length === 0) {
            container.innerHTML = '<p>No categories available</p>';
            return;
        }

        container.innerHTML = data.categories.map(category => `
            <div class="category-card" onclick="goToProducts('${category.id}')">
                <i class="fas fa-tag"></i>
                <h3>${category.name}</h3>
                <p>${category.description || 'Browse products'}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load categories:', error);
        document.getElementById('categoriesGrid').innerHTML = '<p>Failed to load categories</p>';
    }
}

function goToProduct(productId) {
    window.location.href = `/product/${productId}`;
}

function goToProducts(categoryId) {
    window.location.href = `/products?category=${categoryId}`;
}

async function handleAddToCart(event, productId) {
    event.stopPropagation();

    if (!isLoggedIn()) {
        goToLogin();
        return;
    }

    try {
        await apiCall('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity: 1 })
        });

        updateCartCount();
        showNotification('Product added to cart!', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProducts();
    loadCategories();
});
