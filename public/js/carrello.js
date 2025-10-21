// Variabili globali
let carrello = [];
let isUserAuthenticated = false;
let userId = null;

// Funzione per verificare se l'utente è autenticato
async function checkAuthStatus() {
    try {
        // Prima verifichiamo se c'è un indicatore di autenticazione nell'interfaccia
        const loginLink = document.querySelector('.menu-login');
        if (loginLink) {
            // Se c'è il link per il login, l'utente non è autenticato
            isUserAuthenticated = false;
            userId = null;
            return false;
        }

        // Se non c'è il link per il login, verifichiamo con il server
        const response = await fetch('/api/user/profile', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            isUserAuthenticated = true;
            userId = data.user.id;
            return true;
        }

        // Se la risposta non è ok, l'utente non è autenticato
        isUserAuthenticated = false;
        userId = null;
        return false;
    } catch (error) {
        // In caso di errori di rete, assumiamo che l'utente non sia autenticato
        isUserAuthenticated = false;
        userId = null;
        return false;
    }
}

// Carica il carrello dal DB se l'utente è loggato, altrimenti dal localStorage
async function caricaCarrello() {
    try {
        const isAuthenticated = await checkAuthStatus();
        
        if (isAuthenticated) {
            // Se l'utente è autenticato, carica dal database
            const response = await fetch('/api/cart', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    carrello = data.items.map(item => ({
                        id: String(item.product_id),
                        title: item.name,
                        price: parseFloat(item.price),
                        category: item.category || '',
                        image: item.image_url || '',
                        quantity: item.quantity
                    }));
                    salvaCarrello(); 
                    aggiornaInterfacciaCarrello();
                    return;
                }
            }
        }
        
        // Fallback al localStorage se non autenticato o in caso di errore
        const carrelloSalvato = localStorage.getItem('trainlyCart');
        carrello = carrelloSalvato ? JSON.parse(carrelloSalvato) : [];
        
    } catch (error) {
        console.error('Errore nel caricare il carrello:', error);
        carrello = [];
    }
    aggiornaInterfacciaCarrello();
}

// Aggiunge un prodotto al carrello 
async function aggiungiAlCarrello(prodotto) {
    const prodottoEsistente = carrello.find(item => item.id === prodotto.id);
    
    if (prodottoEsistente) {
        prodottoEsistente.quantity++;
    } else {
        prodotto.quantity = 1;
        carrello.push(prodotto);
    }
    
    salvaCarrello(); 
    
    if (isUserAuthenticated) {
        try {
            await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    product_id: prodotto.id,
                    quantity: 1 
                })
            });
        } catch (error) {
            console.error('Errore sincronizzazione aggiunta carrello:', error);
        }
    }
    
    aggiornaInterfacciaCarrello();
    mostraToastAggiunto(prodotto.title);
}

// Rimuove un prodotto dal carrello
async function rimuoviDalCarrello(idProdotto) {
    const indice = carrello.findIndex(prodotto => prodotto.id == idProdotto);
    if (indice !== -1) {
        const prodottoRimosso = carrello[indice];
        carrello.splice(indice, 1);
        salvaCarrello();
        
        if (isUserAuthenticated) {
            try {
                const response = await fetch('/api/cart', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const cartItem = data.items.find(item => item.product_id == idProdotto);
                        if (cartItem) {
                            await fetch(`/api/cart/${cartItem.id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Errore sincronizzazione rimozione:', error);
            }
        }
        
        aggiornaInterfacciaCarrello();
    }
}

// Modifica la quantità di un prodotto 
async function modificaQuantita(idProdotto, nuovaQuantita) {
    const prodotto = carrello.find(item => item.id == idProdotto);
    if (!prodotto) return;

    if (nuovaQuantita <= 0) {
        rimuoviDalCarrello(idProdotto);
        return;
    }

    prodotto.quantity = nuovaQuantita;
    salvaCarrello();

    if (isUserAuthenticated) {
        try {
            const response = await fetch('/api/cart', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const cartItem = data.items.find(item => item.product_id == idProdotto);
                    if (cartItem) {
                        await fetch(`/api/cart/${cartItem.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ quantity: nuovaQuantita })
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Errore sincronizzazione quantità:', error);
        }
    }
    
    aggiornaInterfacciaCarrello();
}

// Sincronizza il carrello del localStorage con il DB dopo il login
async function sincronizzaCarrelloAlLogin() {
    const isAuthenticated = await checkAuthStatus();
    const carrelloLocale = JSON.parse(localStorage.getItem('trainlyCart') || '[]');

    if (isAuthenticated && carrelloLocale.length > 0) {
        try {
            for (const prodotto of carrelloLocale) {
                await fetch('/api/cart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        product_id: prodotto.id,
                        quantity: prodotto.quantity || 1
                    })
                });
            }
            await caricaCarrello();
        } catch (error) {
            console.error('Errore sincronizzazione carrello al login:', error);
        }
    }
}



// Salva il carrello nel localStorage
function salvaCarrello() {
    try {
        localStorage.setItem('trainlyCart', JSON.stringify(carrello));
    } catch (error) {
        console.error('Errore nel salvare il carrello nel localStorage:', error);
    }
}

// Calcola il totale del carrello
function calcolaTotale() {
    return carrello.reduce((totale, prodotto) => totale + (prodotto.price * prodotto.quantity), 0);
}

// Conta il numero totale di articoli nel carrello
function contaArticoli() {
    return carrello.reduce((totale, prodotto) => totale + prodotto.quantity, 0);
}

// Aggiorna l'interfaccia grafica del carrello
function aggiornaInterfacciaCarrello() {
    const carrelloOffcanvas = document.querySelector('#cartOffcanvas .offcanvas-body');
    if (!carrelloOffcanvas) return;

    const numeroArticoli = contaArticoli();

    if (carrello.length === 0) {
        carrelloOffcanvas.className = 'offcanvas-body mx-3 d-flex flex-column justify-content-center align-items-center carrello-vuoto';
        carrelloOffcanvas.innerHTML = `
            <div class="text-center h3 mb-3 text-decoration-none">Il tuo carrello è vuoto</div>
            <a class="btn btn-light" href="/catalogo" role="button">Continua lo shopping</a>
        `;
    } else {
        carrelloOffcanvas.className = 'offcanvas-body px-4 d-flex flex-column';

        let bottoneAzioneHtml = '';
        if (isUserAuthenticated) {
            // Se l'utente è loggato, mostra il bottone per il checkout
            bottoneAzioneHtml = `
                <button class="btn btn-checkout w-100 mb-2 text-white" onclick="procediCheckout()">
                    Procedi al checkout
                </button>
            `;
        } else {
            // Se l'utente NON è loggato, mostra il bottone per accedere
            bottoneAzioneHtml = `
                <a href="/accedi?redirect=/checkout" class="btn btn-checkout w-100 mb-2 text-white">
                    Accedi per continuare
                </a>
            `;
        }

        let htmlCarrello = `
            <div class="carrello-lista">
                ${carrello.map(prodotto => `
                    <div class="carrello-item border-bottom p-3 bg-white rounded mb-2" data-id="${prodotto.id}">
                        <div class="row align-items-center text-black">
                            <div class="col-3">
                                <img src="${prodotto.image || '/img/placeholder.png'}" class="img-fluid rounded" alt="${prodotto.title}">
                            </div>
                            <div class="col-6">
                                <h6 class="mb-1">${prodotto.title}</h6>
                                <div class="d-flex align-items-center mt-2">
                                    <button class="btn btn-sm btn-outline text-black" onclick="modificaQuantita('${prodotto.id}', ${prodotto.quantity - 1})">-</button>
                                    <span class="mx-2">${prodotto.quantity}</span>
                                    <button class="btn btn-sm btn-outline text-black" onclick="modificaQuantita('${prodotto.id}', ${prodotto.quantity + 1})">+</button>
                                </div>
                            </div>
                            <div class="col-3 text-end">
                                <div class="fw-bold">${(prodotto.price * prodotto.quantity).toFixed(2)}€</div>
                                <button class="btn btn-sm btn-delete mt-1" onclick="rimuoviDalCarrello('${prodotto.id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="carrello-footer mt-auto bg-white rounded p-3 shadow-sm" style="flex-shrink: 0;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <strong class="text-dark fs-7">Totale: ${calcolaTotale().toFixed(2)}€</strong>
                    <small class="text-muted">${numeroArticoli} articol${numeroArticoli === 1 ? 'o' : 'i'}</small>
                </div> 
                
                ${bottoneAzioneHtml}
                
                <button class="btn btn-light w-100" onclick="svuotaCarrello()">Svuota carrello</button>
            </div>
        `;
        carrelloOffcanvas.innerHTML = htmlCarrello;
    }
    aggiornaBadgeCarrello();

    // Aggiungi il modal di conferma se non esiste già
    if (!document.getElementById('svuotaCarrelloModal')) {
        const modalHtml = `
            <div class="modal fade" id="svuotaCarrelloModal" tabindex="-1" aria-labelledby="svuotaCarrelloModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title text-white" id="svuotaCarrelloModalLabel">Conferma svuotamento</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-black">
                            Sei sicuro di voler svuotare il carrello?
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-svuota-carrello text-white" onclick="confermaSvuotaCarrello()">Svuota carrello</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

// Mostra il modal di conferma per svuotare il carrello
function svuotaCarrello() {
    const modal = new bootstrap.Modal(document.getElementById('svuotaCarrelloModal'));
    modal.show();
}

// Funzione di conferma per svuotare il carrello
function confermaSvuotaCarrello() {
    carrello = [];
    salvaCarrello();
    if (isUserAuthenticated) {
        fetch('/api/cart/all', { method: 'DELETE', credentials: 'include' });
    }
    // Chiudi il modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('svuotaCarrelloModal'));
    modal.hide();
    // Aggiorna l'interfaccia
    aggiornaInterfacciaCarrello();
}

// Aggiorna il badge del carrello sulla navbar
function aggiornaBadgeCarrello() {
    const numeroArticoli = contaArticoli();
    document.querySelectorAll('.btn-carrello').forEach(bottone => {
        let badge = bottone.querySelector('.badge');
        if (numeroArticoli > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill';
                
                bottone.style.position = 'relative'; 
                
                bottone.appendChild(badge);
            }
            badge.textContent = numeroArticoli > 99 ? '99+' : numeroArticoli;
        } else if (badge) {
            badge.remove();
        }
    });
}

// Reindirizza alla pagina di checkout
function procediCheckout() {
    if (carrello.length === 0) {
        alert('Il carrello è vuoto!');
        return;
    }
    window.location.href = '/checkout';
}

// Mostra una notifica (toast) quando un prodotto viene aggiunto
function mostraToastAggiunto(nomeProdotto) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    const toastHtml = `
        <div class="toast align-items-center text-bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">"${nomeProdotto}" aggiunto al carrello!</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const nuovoToast = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(nuovoToast, { delay: 3000 });
    toast.show();
    nuovoToast.addEventListener('hidden.bs.toast', () => nuovoToast.remove());
}


// Funioni globali per accesso da HTML
window.aggiungiAlCarrello = aggiungiAlCarrello;
window.rimuoviDalCarrello = rimuoviDalCarrello;
window.modificaQuantita = modificaQuantita;
window.svuotaCarrello = svuotaCarrello;
window.confermaVuotaCarrello = confermaVuotaCarrello;
window.procediCheckout = procediCheckout;

// Carica carrello al caricamento della pagina
document.addEventListener('DOMContentLoaded', caricaCarrello);