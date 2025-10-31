// --- INIZIALIZZAZIONE ---

document.addEventListener('DOMContentLoaded', function() {
    toastManager.init();
});

// --- FUNZIONE PRINCIPALE ---
let toastManager = {
    init: function() {
        this.initializeToasts();
        this.bindEvents();
    },

    initializeToasts: function() {
        const toastElements = document.querySelectorAll('.toast');
        toastElements.forEach(toastEl => {
            new bootstrap.Toast(toastEl);
        });
    },

    bindEvents: function() {
        // Newsletter
        const newsletterForm = document.getElementById('newsletterForm');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', this.handleNewsletterSubmit.bind(this));
        }

        // Contatti
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactSubmit.bind(this));
        }
    },

    // Gestione invio form newsletter
    handleNewsletterSubmit: async function(e) {
        e.preventDefault();
        
        const emailInput = document.getElementById('newsletter-email');
        const email = emailInput.value.trim();
        
        if (!email) {
            return;
        }
        
        try {
            const response = await fetch('/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNewsletterToast();
                emailInput.value = '';
            } else {
                if (data.message.includes('già registrata')) {
                    this.showToast('Email già iscritta alla newsletter', 'warning');
                } else {
                    this.showToast(data.message || 'Errore durante l\'iscrizione', 'danger');
                }
            }
            
        } catch (error) {
            console.error('Errore iscrizione newsletter:', error);
            this.showToast('Errore durante l\'iscrizione. Riprova più tardi.', 'danger');
        }
    },

    // Gestione invio form contatti
    handleContactSubmit: async function(e) {
        e.preventDefault();
        e.stopPropagation();

        const form = e.target;
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        try {
            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });

            const result = await response.json();

            if (result.success) {
                this.showContactToast(); 
                form.reset();
                form.classList.remove('was-validated');
            } else {
                alert(result.message || 'Si è verificato un errore.');
            }
        } catch (error) {
            console.error('Errore invio form contatti:', error);
            alert('Impossibile inviare il messaggio. Controlla la tua connessione e riprova.');
        }
    },

    // Mostra il toast di successo per la newsletter
    showNewsletterToast: function() {
        const toast = document.getElementById('newsletterToast');
        if (toast) {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        }
    },

    // Mostra il toast di successo per i contatti
    showContactToast: function() {
        const toast = document.querySelector('#successToast');
        if (toast) {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        } else {
            this.showToast('Messaggio inviato correttamente!', 'success');
        }
    },

    // Funzione generica per mostrare un toast personalizzato
    showToast: function(message, type = 'success') {
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

        newToast.addEventListener('hidden.bs.toast', function() {
            newToast.remove();
        });
    }
};
