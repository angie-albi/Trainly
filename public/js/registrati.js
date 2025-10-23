document.addEventListener('DOMContentLoaded', () => {
    // Collega l'evento di submit del form
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistrationSubmit);
    }

    // Collega l'indicatore di forza della password
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

async function handleRegistrationSubmit(event) {
    event.preventDefault(); // Impedisce il ricaricamento della pagina

    const form = event.target;
    const data = Object.fromEntries(new FormData(form).entries());

    // Validazione base lato client per un feedback immediato
    if (data.email !== data.confirmEmail) {
        showToast('Le email inserite non corrispondono.', 'error');
        return;
    }
    if (data.password !== data.confirmPassword) {
        showToast('Le password inserite non corrispondono.', 'error');
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
            showToast('Registrazione effettuata con successo! Verrai reindirizzato.', 'success');
            setTimeout(() => {
                window.location.href = '/accedi';
            }, 2000);
        } else {
            showToast(result.message || 'Si è verificato un errore.', 'error');
        }
    } catch (error) {
        console.error("Errore di connessione:", error);
        showToast('Errore di connessione con il server. Riprova più tardi.', 'error');
    }
}

function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { color: 'danger', text: 'Debole', percent: 33 };
    if (strength <= 4) return { color: 'warning', text: 'Media', percent: 66 };
    return { color: 'success', text: 'Forte', percent: 100 };
}

function showToast(message, type = 'success') {
    const colors = { error: 'danger', success: 'success', warning: 'warning' };
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