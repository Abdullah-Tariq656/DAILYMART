async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (!email || !password) {
        errorMessage.textContent = 'Please fill in all fields';
        errorMessage.classList.add('show');
        return;
    }

    try {
        errorMessage.classList.remove('show');

        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        setUserData(data.user, data.token);
        showNotification('Login successful!', 'success');

        if (data.user.role === 'admin') {
            setTimeout(() => {
                window.location.href = '/admin-dashboard';
            }, 1000);
        } else {
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        }
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
