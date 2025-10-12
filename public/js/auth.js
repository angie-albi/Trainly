// Gestione autenticazione lato client
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('Auth manager inizializzato');
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // Gestione form di login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Gestione logout
        const logoutLinks = document.querySelectorAll('a[href="/logout"]');
        logoutLinks.forEach(link => {
            link.addEventListener('click', this.handleLogout.bind(this));
        });
    }

    handleLogin(e) {
        // Validazioni lato client prima dell'invio
        const form = e.target;
        const email = form.querySelector('#email')?.value;
        const password = form.querySelector('#password')?.value;

        // Validazione email
        if (email && !this.isValidEmail(email)) {
            e.preventDefault();
            this.showError('Formato email non valido');
            return false;
        }

        // --- INIZIO BLOCCO MODIFICATO: Validazione password robusta ---
        if (!password) { 
            e.preventDefault();
            this.showError('La password è obbligatoria');
            return false;
        }
        if (password.length < 8) { 
            e.preventDefault();
            this.showError('La password deve essere di almeno 8 caratteri');
            return false;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(password)) {
            e.preventDefault();
            this.showError('La password deve contenere almeno una maiuscola, una minuscola, un numero e un carattere speciale');
            return false;
        }

        console.log('Form di login valido, invio al server');
        // Il form verrà inviato normalmente al server
    }


    handleLogout(e) {
        console.log('Logout richiesto');
        // Il link verrà seguito normalmente
    }

    // Utilità per validazione email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Mostra messaggi di errore
    showError(message) {
        // Cerca un container per errori esistente o creane uno
        let errorContainer = document.querySelector('.auth-error');
        
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'alert alert-danger auth-error mt-2';
            
            // Inserisci prima del form
            const form = document.querySelector('form');
            if (form) {
                form.parentNode.insertBefore(errorContainer, form);
            }
        }
        
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // Nascondi dopo 5 secondi
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }

    // Aggiorna UI in base allo stato di autenticazione (se necessario)
    updateUI() {
        // Questo metodo può essere utilizzato per aggiornare l'interfaccia
        // in base ai dati ricevuti dal server (tramite variabili EJS)
        console.log('UI aggiornata');
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    new AuthManager();
});