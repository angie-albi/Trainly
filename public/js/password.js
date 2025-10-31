// Mostra/nascondi password login
const pwdInput = document.getElementById('password');
const toggleBtn = document.getElementById('togglePassword');
const pwdToggleIcon = document.getElementById('toggleIcon');

if (pwdInput && toggleBtn && pwdToggleIcon) {
    toggleBtn.addEventListener('click', () => {
        const isPassword = pwdInput.getAttribute('type') === 'password';
        pwdInput.setAttribute('type', isPassword ? 'text' : 'password');
        pwdToggleIcon.classList.toggle('bi-eye');
        pwdToggleIcon.classList.toggle('bi-eye-slash');
    });
}

// Mostra/nascondi conferma password registrazione
const confirmPwdInput = document.getElementById('confirmPassword');
const toggleConfirmBtn = document.getElementById('toggleConfirmPassword');
const confirmToggleIcon = document.getElementById('toggleConfirmIcon');

if (confirmPwdInput && toggleConfirmBtn && confirmToggleIcon) {
    toggleConfirmBtn.addEventListener('click', () => {
        const isPassword = confirmPwdInput.getAttribute('type') === 'password';
        confirmPwdInput.setAttribute('type', isPassword ? 'text' : 'password');
        confirmToggleIcon.classList.toggle('bi-eye');
        confirmToggleIcon.classList.toggle('bi-eye-slash');
    });
}
