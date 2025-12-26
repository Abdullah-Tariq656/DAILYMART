const productId = new URLSearchParams(window.location.search).get('id') || 
                  window.location.pathname.split('/').pop();

async function loadProductDetails() {
    try {
        const data = await apiCall(`/products/${productId}`);
        const product = data.product;
        const reviews = data.reviews;

        document.getElementById('productName').textContent = product.name;
        document.getElementById('productTitle').textContent = product.name;
        document.getElementById('productImage').src = product.image || 'https://via.placeholder.com/500';
        document.getElementById('productImage').alt = product.name;
        document.getElementById('productDescription').textContent = product.description;
        document.getElementById('productPrice').textContent = formatCurrency(product.price);
        document.getElementById('productStock').textContent = `${product.stock} items available`;
        document.getElementById('productCategory').textContent = product.category_name || 'Uncategorized';

        // Calculate average rating
        if (reviews.length > 0) {
            const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
            document.getElementById('averageRating').textContent = avgRating;
            document.getElementById('ratingStars').innerHTML = '⭐'.repeat(Math.round(avgRating));
            document.getElementById('reviewCount').textContent = `${reviews.length} reviews`;
        }

        // Show review form if logged in
        if (isLoggedIn()) {
            document.getElementById('addReviewForm').style.display = 'block';
        }

        displayReviews(reviews);

        // Update stock button
        const addBtn = document.getElementById('addToCartBtn');
        if (product.stock <= 0) {
            addBtn.disabled = true;
            addBtn.textContent = 'Out of Stock';
        }
    } catch (error) {
        console.error('Failed to load product details:', error);
        showNotification('Failed to load product details', 'error');
    }
}

function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');

    if (reviews.length === 0) {
        container.innerHTML = '<p>No reviews yet. Be the first to review!</p>';
        return;
    }

    container.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <span class="review-author">${review.user_name}</span>
                <span class="review-date">${new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            <div class="review-rating">${'⭐'.repeat(review.rating)}</div>
            <div class="review-comment">${review.comment}</div>
        </div>
    `).join('');
}

function increaseQuantity() {
    const input = document.getElementById('quantity');
    input.value = Math.min(parseInt(input.value) + 1, 100);
}

function decreaseQuantity() {
    const input = document.getElementById('quantity');
    input.value = Math.max(parseInt(input.value) - 1, 1);
}

async function addToCart() {
    if (!isLoggedIn()) {
        goToLogin();
        return;
    }

    try {
        const quantity = parseInt(document.getElementById('quantity').value);

        await apiCall('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId: parseInt(productId), quantity })
        });

        updateCartCount();
        showNotification('Product added to cart!', 'success');
        document.getElementById('quantity').value = 1;
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function submitReview(event) {
    event.preventDefault();

    if (!isLoggedIn()) {
        goToLogin();
        return;
    }

    try {
        const rating = parseInt(document.querySelector('input[name="rating"]:checked').value);
        const comment = document.getElementById('reviewComment').value;

        await apiCall('/reviews/add', {
            method: 'POST',
            body: JSON.stringify({
                productId: parseInt(productId),
                rating,
                comment
            })
        });

        showNotification('Review submitted successfully!', 'success');
        event.target.reset();
        loadProductDetails();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProductDetails();
});
