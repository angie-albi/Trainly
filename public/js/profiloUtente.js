let isEditMode = false;
let originalData = {};

let editBtn, saveBtn, cancelBtn, form;
let nomeInput, cognomeInput, passwordInput, currentPasswordInput, currentPasswordRow, togglePasswordBtn, toggleIcon;
let passwordStrength, passwordRequirements;

function logout() {
    window.location.href = '/logout';
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const isEditing = document.body.classList.toggle('edit-mode', isEditMode);

    nomeInput.disabled = !isEditing;
    cognomeInput.disabled = !isEditing;
    passwordInput.disabled = !isEditing;

    editBtn.style.display = isEditing ? 'none' : 'inline-block';
    saveBtn.style.display = isEditing ? 'inline-block' : 'none';
    cancelBtn.style.display = isEditing ? 'inline-block' : 'none';
    currentPasswordRow.style.display = isEditing ? 'flex' : 'none'; // Mostra/nascondi il campo
    
    if (isEditing) {
        originalData = {
            nome: nomeInput.value,
            cognome: cognomeInput.value,
        };
        passwordInput.value = '';
        passwordInput.placeholder = 'Lascia vuoto per non modificare';
        currentPasswordInput.value = '';
        togglePasswordBtn.style.pointerEvents = 'auto';
        togglePasswordBtn.style.opacity = '1';
        passwordRequirements.style.display = 'block';
        updatePasswordRequirements('');
    } else {
        nomeInput.value = originalData.nome;
        cognomeInput.value = originalData.cognome;
        passwordInput.value = '••••••••';
        passwordInput.placeholder = '';
        togglePasswordBtn.style.pointerEvents = 'none';
        togglePasswordBtn.style.opacity = '0.5';
        toggleIcon.className = 'bi bi-eye-slash';
        passwordStrength.style.display = 'none';
        passwordRequirements.style.display = 'none';
    }
}

function cancelEdit() {
    // Chiama toggleEditMode per tornare allo stato non-modifica e ripristinare i dati
    if (isEditMode) {
        toggleEditMode();
    }
    hideToast('passwordErrorToast');
}

function updatePasswordRequirements(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[^a-zA-Z0-9]/.test(password)
    };
    Object.keys(requirements).forEach(rule => {
        const element = document.querySelector(`[data-rule="${rule}"]`);
        if (element) {
            const icon = element.querySelector('i');
            if (requirements[rule]) {
                icon.className = 'bi bi-check-circle text-success me-1';
                element.classList.add('valid');
                element.classList.remove('invalid');
            } else {
                icon.className = 'bi bi-x-circle text-danger me-1';
                element.classList.add('invalid');
                element.classList.remove('valid');
            }
        }
    });
}

// Funzione per validare la password
function validatePassword(password) {
    const validation = updatePasswordRequirements(password);
    return Object.values(validation).every(Boolean);
}

// Funzione per controllare la forza della password
function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    if (score <= 2) return { text: 'Debole', color: 'danger' };
    if (score <= 3) return { text: 'Media', color: 'warning' };
    if (score <= 4) return { text: 'Forte', color: 'success' };
    return { text: 'Molto Forte', color: 'success' };
}

// Funzioni per i toast
function showToast(toastId) {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }
}

function hideToast(toastId) {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.hide();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    editBtn = document.getElementById('editBtn');
    saveBtn = document.getElementById('saveBtn');
    cancelBtn = document.getElementById('cancelBtn');
    form = document.getElementById('profiloForm');
    nomeInput = document.getElementById('nome');
    cognomeInput = document.getElementById('cognome');
    passwordInput = document.getElementById('password');
    currentPasswordInput = document.getElementById('currentPassword');
    currentPasswordRow = document.getElementById('currentPasswordRow');
    togglePasswordBtn = document.getElementById('togglePassword');
    toggleIcon = document.getElementById('toggleIcon');
    passwordStrength = document.getElementById('passwordStrength');
    passwordRequirements = document.getElementById('passwordRequirements');

    if (togglePasswordBtn) {
        togglePasswordBtn.style.pointerEvents = 'none';
        togglePasswordBtn.style.opacity = '0.5';
    }

    if (editBtn) editBtn.addEventListener('click', toggleEditMode);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);

    if (togglePasswordBtn && toggleIcon) {
        togglePasswordBtn.addEventListener('click', function() {
            if (!isEditMode) return;
            
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            toggleIcon.classList.toggle('bi-eye');
            toggleIcon.classList.toggle('bi-eye-slash');
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            updatePasswordRequirements(password);
            if (isEditMode && password.length > 0) {
                const strength = checkPasswordStrength(password);
                passwordStrength.innerHTML = `<small class="text-${strength.color}">Sicurezza password: ${strength.text}</small>`;
                passwordStrength.style.display = 'block';
            } else {
                passwordStrength.style.display = 'none';
            }
        });
    }

    loadUserProfile();
    loadUserOrders(); 
});

async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) throw new Error('Errore nel caricamento del profilo');
        
        const result = await response.json();
        if (result.success) {
            const user = result.user;
            nomeInput.value = user.nome || '';
            cognomeInput.value = user.cognome || '';
            document.getElementById('staticEmail').value = user.email || '';
            benvenutoUtente.textContent = `Benvenuto, ${user.nome}!`;
            
            if (user.role === 'admin') {
                addAdminPanel();
            }
        }
    } catch (error) {
        console.error('Errore caricamento profilo:', error);
        showErrorMessage('Errore nel caricamento del profilo utente');
    }
}

async function loadUserOrders() {
    const container = document.getElementById('userOrders');
    if (!container) return;
    try {
        const response = await fetch('/api/user/orders');
        if (!response.ok) {
            throw new Error('Endpoint non disponibile o errore di rete');
        }
        
        const result = await response.json();
        
        if (!result.success || !result.orders || result.orders.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <p>Non hai ancora effettuato acquisti.</p>
                    <a href="/catalogo" class="btn btn-light border">Vai al Catalogo</a>
                </div>`;
            return;
        }
        
        container.innerHTML = result.orders.map(order => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title">Ordine #${order.id}</h5>
                            <p class="card-text text-muted"><small>Data: ${new Date(order.created_at).toLocaleDateString('it-IT')}</small></p>
                            <p class="card-text"><strong>Totale: €${parseFloat(order.total).toFixed(2)}</strong></p>
                            <span class="badge bg-${getStatusColor(order.status)} mb-2">${getStatusText(order.status)}</span>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-custom" onclick="viewOrderDetails(${order.id})">
                                <i class="bi bi-eye me-1"></i>Dettagli
                            </button>
                        </div>
                    </div>
                </div>
            </div>`).join('');
        
    } catch (error) {
        console.error('Errore caricamento ordini:', error);
        container.innerHTML = `
            <div class="text-center text-muted">
                <p>Errore nel caricamento degli ordini.</p>
                <button class="btn btn-outline-secondary" onclick="loadUserOrders()">Riprova</button>
            </div>`;
    }
}

if (document.getElementById('profiloForm')) {
    document.getElementById('profiloForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const nuovoNome = nomeInput.value.trim();
        const nuovoCognome = cognomeInput.value.trim();
        const nuovaPassword = passwordInput.value.trim();
        const passwordAttuale = currentPasswordInput.value.trim();

        if (!nuovoNome || !nuovoCognome) {
            return showErrorMessage('Nome e cognome sono obbligatori!');
        }

        let payload = {
            nome: nuovoNome,
            cognome: nuovoCognome
        };
        
        if (nuovaPassword) {
            if (!validatePassword(nuovaPassword)) {
                return showToast('passwordErrorToast');
            }
            if (!passwordAttuale) {
                return showErrorMessage('Devi inserire la password attuale per poterla modificare.');
            }
            payload.password = nuovaPassword;
            payload.currentPassword = passwordAttuale;
        }

        saveBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Salvando...';
        saveBtn.disabled = true;

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Errore durante l\'aggiornamento');
            
            document.getElementById('benvenutoUtente').textContent = `Benvenuto, ${nuovoNome}!`;
            toggleEditMode();
            showToast('successToast');

        } catch (error) {
            console.error('Errore aggiornamento profilo:', error);
            showErrorMessage(error.message);
        } finally {
            saveBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Salva Modifiche';
            saveBtn.disabled = false;
        }
    });
}

function addAdminPanel() {
    const main = document.querySelector('main');
    if (main && !document.getElementById('adminPanel')) {
        const adminPanel = document.createElement('div');
        adminPanel.id = 'adminPanel';
        adminPanel.className = 'card p-4 mt-4 shadow-sm';
        adminPanel.innerHTML = `
            <h3 class="card-title mb-4">Pannello Amministratore</h3>
            <p class="mb-3">Strumenti di amministrazione per gestire il sito Trainly.</p>
            <div class="d-flex flex-wrap gap-2">
                <a href="/admin" class="btn btn-custom text-white">
                    <i class="bi bi-gear me-1"></i> Vai al pannello Admin
                </a>
            </div>`;
        main.appendChild(adminPanel);
    }
}

function getStatusColor(status) {
    const colors = { 'confermato': 'success', 'pending': 'warning', 'cancelled': 'danger' };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = { 'confermato': 'Confermato', 'pending': 'In attesa', 'cancelled': 'Annullato' };
    return texts[status] || 'Sconosciuto';
}

function viewOrderDetails(orderId) {
    window.location.href = `/confermaOrdine?orderId=${orderId}`;
}

function showErrorMessage(message) {
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
        const errorToast = document.createElement('div');
        errorToast.className = 'toast align-items-center text-bg-danger border-0';
        errorToast.setAttribute('role', 'alert');
        errorToast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body"><i class="bi bi-exclamation-triangle me-2"></i>${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>`;
        toastContainer.appendChild(errorToast);
        
        const toast = new bootstrap.Toast(errorToast);
        toast.show();
        
        errorToast.addEventListener('hidden.bs.toast', () => errorToast.remove());
    }
}