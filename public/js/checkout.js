document.addEventListener('DOMContentLoaded', () => {
    // ───── ELEMENTI DOM ─────
    const checkoutForm = document.getElementById('checkoutForm');
    const confirmOrderBtn = document.getElementById('confirmOrderBtn');
    const checkoutItems = document.getElementById('checkoutItems');
    const subtotalElement = document.getElementById('subtotal');
    const taxesElement = document.getElementById('taxes');
    const totalElement = document.getElementById('total');

    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const creditCardDetails = document.getElementById('creditCardDetails');
    const cardNumber = document.getElementById('cardNumber');
    const cvv = document.getElementById('cvv');
    const paypalDetails = document.getElementById('paypalDetails'); 

    let cartItems = [];
    let subtotal = 0, taxes = 0, total = 0;
    

    // ───── FUNZIONE PER VERIFICARE AUTENTICAZIONE ─────
    async function checkAuth() {
        try {
            const response = await fetch('/api/user/profile', {
                credentials: 'include'
            });
            return response.ok;
        } catch (error) {
            console.error('Errore verifica autenticazione:', error);
            return false;
        }
    }

    // ───── CARRELLO ─────
    async function loadCartItems() {
        try {
            // Verifica se l'utente è autenticato
            const isAuthenticated = await checkAuth();
            
            if (!isAuthenticated) {
                alert('Devi essere loggato per procedere al checkout. Verrai reindirizzato alla pagina di login.');
                window.location.href = '/accedi?redirect=/checkout';
                return;
            }

            const res = await fetch('/api/cart', {
                credentials: 'include'
            });
            
            if (res.status === 401) {
                alert('Sessione scaduta. Effettua nuovamente il login.');
                window.location.href = '/accedi?redirect=/checkout';
                return;
            }

            const data = await res.json();

            if (!data.success || data.items.length === 0) {
                alert('Il carrello è vuoto! Verrai reindirizzato al catalogo.');
                window.location.href = '/catalogo';
                return;
            }

            cartItems = data.items;
            renderCartItems();
            calculateTotals();
        } catch (err) {
            console.error('Errore caricamento carrello:', err);
            
            // Fallback: prova a caricare dal localStorage
            try {
                const localCart = localStorage.getItem('trainlyCart');
                if (localCart) {
                    cartItems = JSON.parse(localCart);
                    if (cartItems.length > 0) {
                        renderCartItems();
                        calculateTotals();
                        
                        // Avvisa l'utente che deve loggarsi per completare l'ordine
                        if (confirm('Il tuo carrello contiene prodotti non salvati. Devi loggarti per completare l\'ordine. Vuoi accedere ora?')) {
                            // Salva il carrello temporaneamente per dopo il login
                            localStorage.setItem('tempCart', JSON.stringify(cartItems));
                            window.location.href = '/accedi?redirect=/checkout';
                        }
                        return;
                    }
                }
                
                alert('Il carrello è vuoto! Verrai reindirizzato al catalogo.');
                window.location.href = '/catalogo';
            } catch (fallbackError) {
                console.error('Errore anche nel fallback:', fallbackError);
                alert('Errore durante il caricamento del carrello.');
            }
        }
    }

    function renderCartItems() {
        checkoutItems.innerHTML = cartItems.map(item => `
            <div class="mb-3 pb-3 border-bottom">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${item.name || item.title}</h6>
                        <small class="text-muted">Quantità: ${item.quantity}</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}€</div>
                        <small class="text-muted">${(item.price || 0).toFixed(2)}€/unità</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function calculateTotals() {
        subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
        taxes = subtotal * 0.22;
        total = subtotal + taxes;

        subtotalElement.textContent = `${subtotal.toFixed(2)}€`;
        taxesElement.textContent = `${taxes.toFixed(2)}€`;
        totalElement.textContent = `${total.toFixed(2)}€`;
    }

    // ───── PAGAMENTO ─────
    function setupPaymentMethods() {
        paymentMethods.forEach(radio => {
            radio.addEventListener('change', (event) => {
                if (event.target.value === 'paypal') {
                    creditCardDetails.style.display = 'none';
                    paypalDetails.style.display = 'block';
                } else {
                    creditCardDetails.style.display = 'block';
                    paypalDetails.style.display = 'none';
                }
            });
        });
    }

    function setupCardFormatting() {
        if (cardNumber) {
            cardNumber.addEventListener('input', () => {
                let value = cardNumber.value.replace(/\D/g, '');
                cardNumber.value = value.replace(/(.{4})/g, '$1 ').trim();
            });
        }

        if (cvv) {
            cvv.addEventListener('input', () => {
                cvv.value = cvv.value.replace(/\D/g, '');
            });
        }
    }

    // ───── VALIDAZIONE ─────
    function validateForm() {
        let isValid = true;

        checkoutForm.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                isValid = false;
            } else {
                field.classList.remove('is-invalid');
            }
        });

        const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
        if (selectedPayment?.value === 'credit_card') {
            if (cardNumber.value.replace(/\s/g, '').length !== 16) {
                cardNumber.classList.add('is-invalid');
                isValid = false;
            }
            if (cvv.value.length !== 3) {
                cvv.classList.add('is-invalid');
                isValid = false;
            }
        }

        return isValid;
    }

    // ───── CONFERMA ORDINE ─────
    async function handleOrderConfirmation() {
        if (!validateForm()) {
            return alert('Per favore, compila tutti i campi obbligatori.');
        }

        // Verifica nuovamente l'autenticazione prima di procedere
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            alert('Sessione scaduta. Effettua nuovamente il login.');
            window.location.href = '/accedi?redirect=/checkout';
            return;
        }

        confirmOrderBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Elaborazione...
        `;
        confirmOrderBtn.disabled = true;

        try {
            const payload = {
                customer: {
                    firstName: document.getElementById('firstName').value,
                    lastName: document.getElementById('lastName').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value
                },
                billing: {
                    address: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    postalCode: document.getElementById('postalCode').value,
                    country: document.getElementById('country').value
                },
                payment: {
                    method: document.querySelector('input[name="paymentMethod"]:checked').value,
                    cardNumber: cardNumber.value,
                    cvv: cvv.value,
                    expiryMonth: document.getElementById('expiryMonth')?.value,
                    expiryYear: document.getElementById('expiryYear')?.value
                }
            };

            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (res.status === 401) {
                throw new Error('Sessione scaduta');
            }

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.message || 'Errore durante il checkout');
            }

            // Mostra il toast di successo
            const toast = new bootstrap.Toast(document.getElementById('orderSuccessToast'));
            toast.show();

            // Svuota il carrello locale
            localStorage.removeItem('trainlyCart');
            localStorage.removeItem('tempCart');

            setTimeout(() => {
                window.location.href = `/confermaOrdine?orderId=${data.orderId}`;
            }, 2500);

        } catch (err) {
            console.error('Errore conferma ordine:', err);
            
            if (err.message === 'Sessione scaduta') {
                alert('Sessione scaduta. Effettua nuovamente il login.');
                window.location.href = '/accedi?redirect=/checkout';
            } else {
                alert('Errore durante il pagamento: ' + err.message);
            }
            
            confirmOrderBtn.disabled = false;
            confirmOrderBtn.innerHTML = 'Conferma ordine';
        }
    }

    // ───── INIT ─────
    function init() {
        loadCartItems();
        setupPaymentMethods();
        setupCardFormatting();
        confirmOrderBtn.addEventListener('click', handleOrderConfirmation);
    }

    init();
});