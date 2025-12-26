let currentPage = 1;
const itemsPerPage = 12;

async function loadProducts() {
    try {
        const searchQuery = document.getElementById('searchInput').value;
        const categoryId = document.getElementById('categoryFilter').value;

        const params = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            search: searchQuery,
            category: categoryId
        });

        const data = await apiCall(`/products?${params.toString()}`);
        displayProducts(data.products);
        displayPagination(data.pages, data.currentPage);
    } catch (error) {
        console.error('Failed to load products:', error);
        document.getElementById('productsGrid').innerHTML = '<p>Failed to load products</p>';
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsGrid');

    if (products.length === 0) {
        container.innerHTML = '<p>No products found</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" onclick="goToProduct(${product.id})">
            <div class="product-image">
                <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}">
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${formatCurrency(product.price)}</div>
                <div class="product-rating">${product.stock > 0 ? '✓ In Stock' : '✗ Out of Stock'}</div>
                <div class="product-actions">
                    <button class="btn-primary" onclick="handleAddToCart(event, ${product.id})">Add to Cart</button>
                    <button class="btn-secondary" onclick="goToProduct(${product.id})">View</button>
                </div>
            </div>
        </div>
    `).join('');
}

function displayPagination(totalPages, currentPageNum) {
    const container = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    if (currentPageNum > 1) {
        html += `<button onclick="goToPage(${currentPageNum - 1})">← Previous</button>`;
    }

    for (let i = Math.max(1, currentPageNum - 2); i <= Math.min(totalPages, currentPageNum + 2); i++) {
        html += `<button onclick="goToPage(${i})" class="${i === currentPageNum ? 'active' : ''}">${i}</button>`;
    }

    if (currentPageNum < totalPages) {
        html += `<button onclick="goToPage(${currentPageNum + 1})">Next →</button>`;
    }

    container.innerHTML = html;
}

function goToPage(pageNum) {
    currentPage = pageNum;
    loadProducts();
    window.scrollTo(0, 0);
}

async function loadCategories() {
    try {
        const data = await apiCall('/products/categories/all');
        const select = document.getElementById('categoryFilter');

        const categories = data.categories;
        select.innerHTML += categories.map(cat => `
            <option value="${cat.id}">${cat.name}</option>
        `).join('');
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function applyFilters() {
    currentPage = 1;
    loadProducts();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    currentPage = 1;
    loadProducts();
}

function goToProduct(productId) {
    window.location.href = `/product/${productId}`;
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();

    document.getElementById('searchInput').addEventListener('keyup', () => {
        currentPage = 1;
        loadProducts();
    });

    document.getElementById('categoryFilter').addEventListener('change', () => {
        currentPage = 1;
        loadProducts();
    });
});
