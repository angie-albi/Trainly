let isEditMode = false;
let originalData = {};

let editBtn, saveBtn, cancelBtn, form;
let nomeInput, cognomeInput, passwordInput, togglePasswordBtn, toggleIcon;
let passwordStrength, passwordRequirements;

function logout() {
    window.location.href = '/logout';
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    if (isEditMode) {
        document.body.classList.add('edit-mode');
        originalData = {
            nome: nomeInput.value,
            cognome: cognomeInput.value,
            password: passwordInput.value
        };
        nomeInput.removeAttribute('disabled');
        cognomeInput.removeAttribute('disabled');
        passwordInput.removeAttribute('disabled');
        passwordInput.setAttribute('type', 'text');
        passwordInput.value = ''; // Svuota il campo password per inserirne una nuova
        togglePasswordBtn.removeAttribute('disabled');
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        passwordRequirements.style.display = 'block';
        updatePasswordRequirements('');
    } else {
        document.body.classList.remove('edit-mode');
        nomeInput.setAttribute('disabled', true);
        cognomeInput.setAttribute('disabled', true);
        passwordInput.setAttribute('disabled', true);
        passwordInput.setAttribute('type', 'password');
        passwordInput.value = '••••••••'; // Ripristina il placeholder
        togglePasswordBtn.setAttribute('disabled', true);
        toggleIcon.className = 'bi bi-eye-slash';
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        passwordStrength.style.display = 'none';
        passwordRequirements.style.display = 'none';
    }
}

function cancelEdit() {
    nomeInput.value = originalData.nome;
    cognomeInput.value = originalData.cognome;
    passwordInput.value = originalData.password;
    toggleEditMode();
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
    if (password.length < 8) return { isValid: false, message: 'Almeno 8 caratteri' };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: 'Almeno una maiuscola' };
    if (!/[a-z]/.test(password)) return { isValid: false, message: 'Almeno una minuscola' };
    if (!/\d/.test(password)) return { isValid: false, message: 'Almeno un numero' };
    if (!/[^a-zA-Z0-9]/.test(password)) return { isValid: false, message: 'Almeno un carattere speciale' };
    return { isValid: true };
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
    togglePasswordBtn = document.getElementById('togglePassword');
    toggleIcon = document.getElementById('toggleIcon');
    passwordStrength = document.getElementById('passwordStrength');
    passwordRequirements = document.getElementById('passwordRequirements');

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
                const validation = validatePassword(password);
                if (validation.isValid) hideToast('passwordErrorToast');
            }
        });
    }

    // Carica i dati del profilo utente
    loadUserProfile();
    
    // Carica gli ordini dell'utente
    loadUserOrders(); 
});

//Carica profilo utente dall'API
async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) {
            throw new Error('Errore nel caricamento del profilo');
        }
        
        const result = await response.json();
        if (result.success) {
            const user = result.user;
            
            // Aggiorna i campi del form con i dati dell'utente
            if (nomeInput) nomeInput.value = user.nome || '';
            if (cognomeInput) cognomeInput.value = user.cognome || '';
            if (document.getElementById('staticEmail')) {
                document.getElementById('staticEmail').value = user.email || '';
            }
            
            // Aggiorna il messaggio di benvenuto
            const benvenutoElement = document.getElementById('benvenutoUtente');
            if (benvenutoElement) {
                // Messaggio di benvenuto unificato per tutti
                benvenutoElement.textContent = `Benvenuto, ${user.nome}!`;
                
                // Controlla il ruolo per aggiungere il pannello admin
                if (user.role === 'admin') {
                    addAdminPanel();
                }
            }
        }
    } catch (error) {
        console.error('Errore caricamento profilo:', error);
        showErrorMessage('Errore nel caricamento del profilo utente');
    }
}

// Carica ordini utente dall'API
async function loadUserOrders() {
    try {
        const response = await fetch('/api/user/orders');
        const container = document.getElementById('userOrders');
        
        if (!container) return;
        
        if (!response.ok) {
            // Se l'endpoint non esiste ancora, mostra un messaggio placeholder
            container.innerHTML = `
                <div class="text-center text-muted">
                    <p>Non hai ancora effettuato acquisti.</p>
                    <a href="/catalogo" class="btn btn-primary">Vai al Catalogo</a>
                </div>
            `;
            return;
        }
        
        const result = await response.json();
        container.innerHTML = '';
        
        if (!result.success || !result.orders || result.orders.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <p>Non hai ancora effettuato acquisti.</p>
                    <a href="/catalogo" class="btn btn-primary">Vai al Catalogo</a>
                </div>
            `;
            return;
        }
        
        // Mostra gli ordini
        result.orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'card mb-3';
            orderDiv.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title">Ordine #${order.id}</h5>
                            <p class="card-text text-muted">
                                <small>Data: ${new Date(order.created_at).toLocaleDateString('it-IT')}</small>
                            </p>
                            <p class="card-text">
                                <strong>Totale: €${parseFloat(order.total).toFixed(2)}</strong>
                            </p>
                            <span class="badge bg-${getStatusColor(order.status)} mb-2">
                                ${getStatusText(order.status)}
                            </span>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails(${order.id})">
                                <i class="bi bi-eye me-1"></i>Dettagli
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(orderDiv);
        });
        
    } catch (error) {
        console.error('Errore caricamento ordini:', error);
        const container = document.getElementById('userOrders');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <p>Errore nel caricamento degli ordini.</p>
                    <button class="btn btn-outline-secondary" onclick="loadUserOrders()">Riprova</button>
                </div>
            `;
        }
    }
}

// Aggiorna profilo via API
const profiloForm = document.getElementById('profiloForm');
if (profiloForm) {
    profiloForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nuovoNome = nomeInput.value.trim();
        const nuovoCognome = cognomeInput.value.trim();
        const nuovaPassword = passwordInput.value.trim();

        // Validazione frontend
        if (!nuovoNome || !nuovoCognome) {
            showErrorMessage('Nome e cognome sono obbligatori!');
            return;
        }

        // Validazione password solo se è stata inserita
        let passwordToSend = null;
        if (nuovaPassword && nuovaPassword !== '••••••••') {
            const passwordValidation = validatePassword(nuovaPassword);
            if (!passwordValidation.isValid) {
                showToast('passwordErrorToast');
                return;
            }
            passwordToSend = nuovaPassword;
        }

        // Mostra loading
        const originalSaveText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Salvando...';
        saveBtn.disabled = true;

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nome: nuovoNome,
                    cognome: nuovoCognome,
                    ...(passwordToSend && { password: passwordToSend })
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Errore durante l\'aggiornamento');
            }

            if (result.success) {
                // Aggiorna il messaggio di benvenuto
                const benvenutoElement = document.getElementById('benvenutoUtente');
                if (benvenutoElement) {
                    benvenutoElement.textContent = `Benvenuto, ${nuovoNome}!`;
                }
                
                // Esci dalla modalità edit
                toggleEditMode();
                
                // Mostra messaggio di successo
                showToast('successToast');
            } else {
                throw new Error(result.message || 'Errore sconosciuto');
            }
        } catch (error) {
            console.error('Errore aggiornamento profilo:', error);
            showErrorMessage(error.message);
        } finally {
            // Ripristina il bottone
            saveBtn.innerHTML = originalSaveText;
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
            <h3 class="card-title mb-4">
                Pannello Amministratore
            </h3>
            <p class="mb-3">Strumenti di amministrazione per gestire il sito Trainly.</p>
            <div class="d-flex flex-wrap gap-2">
                <a href="/admin" class="btn btn-custom text-white">
                    <i class="bi bi-gear me-1"></i> Vai al pannello Admin
                </a>
            </div>
        `;
        main.appendChild(adminPanel);
    }
}

function getStatusColor(status) {
    switch(status) {
        case 'completed': return 'success';
        case 'pending': return 'warning';
        case 'cancelled': return 'danger';
        case 'processing': return 'info';
        default: return 'secondary';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'completed': return 'Completato';
        case 'pending': return 'In attesa';
        case 'cancelled': return 'Annullato';
        case 'processing': return 'In elaborazione';
        default: return 'Sconosciuto';
    }
}

function viewOrderDetails(orderId) {
    window.location.href = `/confermaOrdine?orderId=${orderId}`;
}

function showErrorMessage(message) {
    // Crea un toast di errore dinamico
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
        const errorToast = document.createElement('div');
        errorToast.className = 'toast align-items-center text-bg-danger border-0';
        errorToast.setAttribute('role', 'alert');
        errorToast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-exclamation-triangle me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(errorToast);
        
        const toast = new bootstrap.Toast(errorToast);
        toast.show();
        
        // Rimuovi l'elemento dopo che si nasconde
        errorToast.addEventListener('hidden.bs.toast', () => {
            errorToast.remove();
        });
    }
}

async function loadAdminStats() {
    try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
            const stats = await response.json();
            alert(`Statistiche Admin:\nUtenti totali: ${stats.totalUsers}\nOrdini totali: ${stats.totalOrders}`);
        } else {
            throw new Error('Impossibile caricare le statistiche');
        }
    } catch (error) {
        console.error('Errore caricamento statistiche:', error);
        showErrorMessage('Errore nel caricamento delle statistiche');
    }
}