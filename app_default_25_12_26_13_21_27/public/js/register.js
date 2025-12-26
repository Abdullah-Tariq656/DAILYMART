async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorMessage = document.getElementById('errorMessage');

    if (!name || !email || !phone || !password || !confirmPassword) {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.classList.add('show');
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match';
        errorMessage.classList.add('show');
        return;
    }

    if (password.length < 6) {
        errorMessage.textContent = 'Password must be at least 6 characters';
        errorMessage.classList.add('show');
        return;
    }

    try {
        errorMessage.classList.remove('show');

        await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, phone, password })
        });

        showNotification('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.add('show');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        window.location.href = '/';
    }
});
