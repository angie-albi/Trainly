// Gestione toast e notifiche
let toastManager = {
    init: function() {
        console.log('Toast manager inizializzato');
        this.initializeToasts();
        this.bindEvents();
    },

    initializeToasts: function() {
        // Inizializza tutti i toast Bootstrap presenti nella pagina
        const toastElements = document.querySelectorAll('.toast');
        toastElements.forEach(toastEl => {
            new bootstrap.Toast(toastEl);
        });
    },

    bindEvents: function() {
        // Gestione form newsletter
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', this.handleNewsletterSubmit.bind(this));
        }

        // Gestione form contatti
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactSubmit.bind(this));
        }
    },

    handleNewsletterSubmit: function(e) {
        e.preventDefault();
        
        const email = document.getElementById('newsletter-email').value;
        if (email) {
            // Simula l'invio (in un progetto reale faresti una chiamata al server)
            this.showNewsletterToast();
            document.getElementById('newsletter-email').value = '';
        }
    },

    handleContactSubmit: function(e) {
        e.preventDefault();
        
        const form = e.target;
        
        // Validazione form
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return false;
        }
        
        // Form valido - mostra toast di successo
        this.showContactToast();
        
        // Reset form
        form.reset();
        form.classList.remove('was-validated');
        
        return false;
    },

    showNewsletterToast: function() {
        const toast = document.getElementById('newsletterToast');
        if (toast) {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    },

    showContactToast: function() {
        // Cerca il toast di successo per i contatti
        const toast = document.querySelector('#successToast');
        if (toast) {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        } else {
            // Se non trova il toast, ne crea uno dinamicamente
            this.showToast('Messaggio inviato correttamente!', 'success');
        }
    },

    showToast: function(message, type = 'success') {
        // Funzione generica per mostrare toast
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) return;

        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const newToast = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(newToast);
        bsToast.show();

        // Rimuovi il toast dal DOM dopo che è stato nascosto
        newToast.addEventListener('hidden.bs.toast', function() {
            newToast.remove();
        });
    }
};

// Funzioni globali per compatibilità 
function handleNewsletterSubmit(event) {
    return toastManager.handleNewsletterSubmit(event);
}

function handleContactSubmit(event) {
    return toastManager.handleContactSubmit(event);
}

function validateForm(event) {
    return handleContactSubmit(event);
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    toastManager.init();
});