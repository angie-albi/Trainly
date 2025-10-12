// ============================
// FUNZIONI TOAST
// ============================
function showToast(toastId) {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
        toast.show();
    }
}

function hideToast(toastId) {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        const toast = bootstrap.Toast.getOrCreateInstance(toastElement);
        toast.hide();
    }
}

// ============================
// VALIDAZIONE PASSWORD
// ============================
function validatePassword(password) {
    const errors = [];

    if (password.length < 8) errors.push("Almeno 8 caratteri");
    if (!/[A-Z]/.test(password)) errors.push("Almeno una lettera maiuscola (A-Z)");
    if (!/[a-z]/.test(password)) errors.push("Almeno una lettera minuscola (a-z)");
    if (!/\d/.test(password)) errors.push("Almeno un numero (0-9)");
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push("Almeno un carattere speciale (!@#$%^&*)");

    return {
        isValid: errors.length === 0,
        errors
    };
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

// ============================
// VALIDAZIONE FORM
// ============================
async function validateForm(event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const cognome = document.getElementById('cognome').value.trim();
    const email = document.getElementById('email').value.trim();
    const confirmEmail = document.getElementById('confirmEmail').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    hideToast('emailErrorToast');
    hideToast('passwordErrorToast');
    hideToast('weakPasswordToast');

    if (email !== confirmEmail) {
        showToast('emailErrorToast');
        return false;
    }

    if (password !== confirmPassword) {
        showToast('passwordErrorToast');
        return false;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
        const reqContainer = document.getElementById('passwordRequirements');
        if (reqContainer) {
            reqContainer.innerHTML = validation.errors.map(err => `<div>- ${err}</div>`).join("");
        }
        showToast('weakPasswordToast');
        return false;
    }

    // 🚀 INVIO DATI AL SERVER
    try {
        const response = await fetch('/registrati', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cognome, email, password, confirmPassword })
        });

        if (response.ok) {
            SuccessRegistration();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Errore registrazione:", errorData);
            showToast('weakPasswordToast'); // puoi creare un toast "registerErrorToast"
        }
    } catch (error) {
        console.error("Errore di rete:", error);
        showToast('weakPasswordToast'); // o un toast dedicato per errore server
    }

    return true;
}


// ============================
// SUCCESSO REGISTRAZIONE
// ============================
function SuccessRegistration() {
    showToast('registerSuccessToast'); 
    document.getElementById('registrationForm').reset();
    document.getElementById('passwordStrength').style.display = 'none';

    // Redirect dopo mezzo secondo
    setTimeout(() => {
        window.location.href = '/profiloUtente';
    }, 500);
}

// ============================
// EVENT LISTENERS
// ============================
document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', validateForm);
    }

    const passwordField = document.getElementById('password');
    const strengthIndicator = document.getElementById('passwordStrength');
    if (passwordField && strengthIndicator) {
        passwordField.addEventListener('input', function () {
            const value = this.value;

            if (value.length > 0) {
                const strength = checkPasswordStrength(value);

                // Barra + testo
                strengthIndicator.innerHTML = `
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-${strength.color}" 
                             role="progressbar" 
                             style="width: ${strength.percent}%"></div>
                    </div>
                    <small class="text-${strength.color}">
                        Sicurezza password: ${strength.text}
                    </small>
                `;
                strengthIndicator.style.display = 'block';
            } else {
                strengthIndicator.style.display = 'none';
            }
        });
    }
});
