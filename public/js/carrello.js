// --- VARIABILI GLOBALI ---
let carrello = [];
let isUserAuthenticated = false;
let userId = null;

// ---INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', caricaCarrello);

// --- FUNZIONI PRINCIPALI ---
// Funzione per verificare se l'utente è autenticato
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/user/profile', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            isUserAuthenticated = true;
            userId = data.user.id;
            return true;
        }

        isUserAuthenticated = false;
        userId = null;
        return false;
    } catch (error) {
        isUserAuthenticated = false;
        userId = null;
        return false;
    }
}

// Carica il carrello dal DB se l'utente è loggato, altrimenti dal localStorage
async function caricaCarrello() {
    try {
        await checkAuthStatus();
        
        if (isUserAuthenticated) {
            // Se l'utente è autenticato, sincronizza il carrello locale (se esiste) e poi carica dal DB
            await sincronizzaCarrelloAlLogin();
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
                }
            }
        } else {
            // Fallback al localStorage se non autenticato
            const carrelloSalvato = localStorage.getItem('trainlyCart');
            carrello = carrelloSalvato ? JSON.parse(carrelloSalvato) : [];
        }
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
    } else {
        salvaCarrelloInLocale(); 
    }
    
    aggiornaInterfacciaCarrello();
    mostraToastAggiunto(prodotto.title);
}

// Rimuove un prodotto dal carrello
async function rimuoviDalCarrello(idProdotto) {
    const indice = carrello.findIndex(prodotto => prodotto.id == idProdotto);
    if (indice !== -1) {
        carrello.splice(indice, 1);
        
        if (isUserAuthenticated) {
            try {
                await fetch(`/api/cart/product/${idProdotto}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
            } catch (error) {
                console.error('Errore sincronizzazione rimozione:', error);
            }
        } else {
            salvaCarrelloInLocale();
        }
        
        aggiornaInterfacciaCarrello();
    }
}

// Modifica la quantità di un prodotto 
async function modificaQuantita(idProdotto, nuovaQuantita) {
    if (nuovaQuantita <= 0) {
        rimuoviDalCarrello(idProdotto);
        return;
    }
    
    const prodotto = carrello.find(item => item.id == idProdotto);
    if (!prodotto) return;

    prodotto.quantity = nuovaQuantita;

    if (isUserAuthenticated) {
        try {
            await fetch(`/api/cart/product/${idProdotto}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ quantity: nuovaQuantita })
            });
        } catch (error) {
            console.error('Errore sincronizzazione quantità:', error);
        }
    } else {
        salvaCarrelloInLocale();
    }
    
    aggiornaInterfacciaCarrello();
}

// Sincronizza il carrello del localStorage con il DB dopo il login
async function sincronizzaCarrelloAlLogin() {
    const carrelloLocale = JSON.parse(localStorage.getItem('trainlyCart') || '[]');
    if (isUserAuthenticated && carrelloLocale.length > 0) {
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
            // Pulisce il localStorage solo dopo la sincronizzazione
            localStorage.removeItem('trainlyCart');
        } catch (error) {
            console.error('Errore sincronizzazione carrello al login:', error);
        }
    }
}

// Salva il carrello nel localStorage (SOLO per utenti non loggati)
function salvaCarrelloInLocale() {
    if (isUserAuthenticated) return; 
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
        carrelloOffcanvas.className = 'offcanvas-body px-4 d-flex flex-column position-relative h-100';

        let bottoneAzioneHtml = isUserAuthenticated
            ? `<button class="btn btn-checkout w-100 mb-2 text-white" onclick="procediCheckout()">Procedi al checkout</button>`
            : `<a href="/accedi?redirect=/checkout" class="btn btn-checkout w-100 mb-2 text-white">Accedi per continuare</a>`;

        carrelloOffcanvas.innerHTML = `
            <div class="carrello-lista overflow-auto mb-auto">
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
            <div class="carrello-footer mt-2 bg-white rounded p-3 shadow-sm position-sticky bottom-0 w-100" style="flex-shrink: 0;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <strong class="text-dark fs-7">Totale: ${calcolaTotale().toFixed(2)}€</strong>
                    <small class="text-muted">${numeroArticoli} articol${numeroArticoli === 1 ? 'o' : 'i'}</small>
                </div> 
                ${bottoneAzioneHtml}
                <button class="btn btn-light w-100" onclick="svuotaCarrello()">Svuota carrello</button>
            </div>
        `;
    }
    aggiornaBadgeCarrello();

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
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

// Mostra il modal di conferma per svuotare il carrello
function svuotaCarrello() {
    const modal = new bootstrap.Modal(document.getElementById('svuotaCarrelloModal'));
    modal.show();
}

// Funzione di conferma per svuotare il carrello
async function confermaSvuotaCarrello() {
    carrello = [];
    if (isUserAuthenticated) {
        try {
            await fetch('/api/cart/all', { method: 'DELETE', credentials: 'include' });
        } catch (error) {
            console.error('Errore svuotamento carrello DB:', error);
        }
    } else {
        salvaCarrelloInLocale();
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('svuotaCarrelloModal'));
    modal.hide();
    
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

// --- èFUNZIONI GLOBALI --- 
window.confermaSvuotaCarrello = confermaSvuotaCarrello;
window.aggiungiAlCarrello = aggiungiAlCarrello;
window.rimuoviDalCarrello = rimuoviDalCarrello;
window.modificaQuantita = modificaQuantita;
window.svuotaCarrello = svuotaCarrello;
window.procediCheckout = procediCheckout;
