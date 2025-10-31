// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistrationSubmit);
    }

    // Logica per l'indicatore di forza della password
    const passwordField = document.getElementById('password');
    const strengthIndicator = document.getElementById('passwordStrength');
    if (passwordField && strengthIndicator) {
        passwordField.addEventListener('input', function () {
            const passwordValue = this.value;
            if (passwordValue.length > 0) {
                const strength = checkPasswordStrength(passwordValue);
                strengthIndicator.innerHTML = `
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-${strength.color}" role="progressbar" style="width: ${strength.percent}%"></div>
                    </div>
                    <small class="text-${strength.color}">Sicurezza password: ${strength.text}</small>
                `;
                strengthIndicator.style.display = 'block';
            } else {
                strengthIndicator.style.display = 'none';
            }
        });
    }
});

// --- FUNZIONE PRINCIPALE ---
async function handleRegistrationSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form).entries());

    if (data.email !== data.confirmEmail) {
        showToast('Le email inserite non corrispondono.', 'error');
        return;
    }
    if (data.password !== data.confirmPassword) {
        showToast('Le password non corrispondono.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Registrazione effettuata! Verrai reindirizzato.', 'success');
            setTimeout(() => { window.location.href = '/accedi'; }, 1000);
        } else {
            if (result.errorType === 'WEAK_PASSWORD') {
                showWeakPasswordToast();
            } else {
                showToast(result.message || 'Si è verificato un errore.', 'error');
            }
        }
    } catch (error) {
        showToast('Errore di connessione con il server. Riprova più tardi.', 'error');
    }
}

// --- FUNZIONI DI INTERFACCIA PUBBLICA ---
function showWeakPasswordToast() {
    const toastElement = document.getElementById('weakPasswordToast');
    if (toastElement) {
        const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
        toast.show();
    }
}

// Funzione per controllare la forza della password
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    let percent = (strength / 5) * 100;
    if (strength <= 2) return { color: 'danger', text: 'Debole', percent: Math.max(percent, 20) };
    if (strength <= 4) return { color: 'warning', text: 'Media', percent };
    return { color: 'success', text: 'Forte', percent };
}

// Funzione generica per mostrare un toast
function showToast(message, type = 'success') {
    const colors = { error: 'danger', success: 'success' };
    const bgColor = colors[type] || 'primary';
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    const toastId = `toast-${Date.now()}`;
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-bg-${bgColor} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`;
    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 5000 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}