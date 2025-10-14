// Gestione autenticazione lato client
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // Gestione logout
        const logoutLinks = document.querySelectorAll('a[href="/logout"]');
        logoutLinks.forEach(link => {
            link.addEventListener('click', this.handleLogout.bind(this));
        });
    }

    handleLogout(e) {
        console.log('Logout richiesto');
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