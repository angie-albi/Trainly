// Aggiungi queste variabili all'inizio del file
let carrello = [];
let isUserAuthenticated = false;
let userId = null;

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
        return false;
    } catch (error) {
        console.error('Errore verifica autenticazione:', error);
        return false;
    }
}

// Modifica la funzione caricaCarrello
async function caricaCarrello() {
    try {
        // Prima controlla se c'è un carrello nel localStorage
        const carrelloSalvato = localStorage.getItem('trainlyCart');
        
        // Verifica se l'utente è autenticato
        const isAuthenticated = await checkAuthStatus();
        
        if (isAuthenticated) {
            // Se autenticato, carica dal database
            try {
                const response = await fetch('/api/cart', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        // Converti gli elementi del carrello dal database al formato del carrello locale
                        carrello = data.items.map(item => ({
                            id: item.product_id.toString(),
                            title: item.name,
                            price: parseFloat(item.price),
                            category: '', // Potresti dover aggiungere questa info al database
                            image: item.image_url || '',
                            quantity: item.quantity
                        }));
                        
                        // Sincronizza con localStorage come backup
                        localStorage.setItem('trainlyCart', JSON.stringify(carrello));
                        return;
                    }
                }
            } catch (error) {
                console.error('Errore caricamento carrello dal database:', error);
            }
        }
        
        // Fallback al localStorage se non autenticato o errore
        if (carrelloSalvato) {
            carrello = JSON.parse(carrelloSalvato);
        } else {
            carrello = [];
        }
    } catch (error) {
        console.error('Errore nel caricare il carrello:', error);
        carrello = [];
    }
}

// Modifica la funzione aggiungiAlCarrello
async function aggiungiAlCarrello(prodotto) {
    const prodottoEsistente = carrello.find(item => item.id === prodotto.id);
    
    if (prodottoEsistente) {
        prodottoEsistente.quantity = (prodottoEsistente.quantity || 1) + 1;
    } else {
        prodotto.quantity = 1;
        carrello.push(prodotto);
    }
    
    // Salva nel localStorage come backup
    salvaCarrello();
    
    // Se l'utente è autenticato, salva anche nel database
    if (isUserAuthenticated) {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    product_id: prodotto.id,
                    quantity: prodottoEsistente ? prodottoEsistente.quantity : 1
                })
            });
            
            if (!response.ok) {
                console.error('Errore salvataggio carrello nel database');
            }
        } catch (error) {
            console.error('Errore sincronizzazione carrello:', error);
        }
    }
    
    aggiornaInterfacciaCarrello();
    mostraToastAggiunto(prodotto.title);
}

// Modifica la funzione rimuoviDalCarrello
async function rimuoviDalCarrello(idProdotto) {
    const indice = carrello.findIndex(prodotto => prodotto.id == idProdotto);
    if (indice !== -1) {
        const prodottoRimosso = carrello[indice];
        carrello.splice(indice, 1);
        
        // Salva nel localStorage
        salvaCarrello();
        
        // Se l'utente è autenticato, rimuovi anche dal database
        if (isUserAuthenticated) {
            try {
                // Prima trova l'ID dell'elemento nel carrello del database
                const response = await fetch('/api/cart', {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const cartItem = data.items.find(item => item.product_id == idProdotto);
                        if (cartItem) {
                            const deleteResponse = await fetch(`/api/cart/${cartItem.id}`, {
                                method: 'DELETE',
                                credentials: 'include'
                            });
                            
                            if (!deleteResponse.ok) {
                                console.error('Errore rimozione prodotto dal database');
                            }
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

// Modifica la funzione modificaQuantita
async function modificaQuantita(idProdotto, nuovaQuantita) {
    const prodotto = carrello.find(item => item.id == idProdotto);
    if (prodotto) {
        if (nuovaQuantita <= 0) {
            rimuoviDalCarrello(idProdotto);
        } else {
            prodotto.quantity = nuovaQuantita;
            
            // Salva nel localStorage
            salvaCarrello();
            
            // Se l'utente è autenticato, aggiorna anche nel database
            if (isUserAuthenticated) {
                try {
                    // Prima trova l'ID dell'elemento nel carrello del database
                    const response = await fetch('/api/cart', {
                        credentials: 'include'
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success) {
                            const cartItem = data.items.find(item => item.product_id == idProdotto);
                            if (cartItem) {
                                const updateResponse = await fetch(`/api/cart/${cartItem.id}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                        quantity: nuovaQuantita
                                    })
                                });
                                
                                if (!updateResponse.ok) {
                                    console.error('Errore aggiornamento quantità nel database');
                                }
                            } else if (nuovaQuantita > 0) {
                                // Se non esiste ma la quantità è > 0, aggiungilo
                                const addResponse = await fetch('/api/cart', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                        product_id: idProdotto,
                                        quantity: nuovaQuantita
                                    })
                                });
                                
                                if (!addResponse.ok) {
                                    console.error('Errore aggiunta prodotto al database');
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('Errore sincronizzazione quantità:', error);
                }
            }
            
            aggiornaInterfacciaCarrello();
        }
    }
}

// Aggiungi questa funzione per sincronizzare il carrello al login
async function sincronizzaCarrelloAlLogin() {
    const isAuthenticated = await checkAuthStatus();
    
    if (isAuthenticated && carrello.length > 0) {
        try {
            // Per ogni prodotto nel carrello locale, aggiungilo al database
            for (const prodotto of carrello) {
                const response = await fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        product_id: prodotto.id,
                        quantity: prodotto.quantity || 1
                    })
                });
                
                if (!response.ok) {
                    console.error(`Errore sincronizzazione prodotto ${prodotto.id}`);
                }
            }
            
            // Dopo la sincronizzazione, ricarica il carrello dal database
            // per assicurarsi di avere lo stato più recente
            const response = await fetch('/api/cart', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    carrello = data.items.map(item => ({
                        id: item.product_id.toString(),
                        title: item.name,
                        price: parseFloat(item.price),
                        category: '',
                        image: item.image_url || '',
                        quantity: item.quantity
                    }));
                    
                    // Aggiorna il localStorage
                    salvaCarrello();
                    aggiornaInterfacciaCarrello();
                }
            }
        } catch (error) {
            console.error('Errore sincronizzazione carrello al login:', error);
        }
    }
}

// Aggiungi prodotto 
function aggiungiAlCarrello(prodotto) {
    const prodottoEsistente = carrello.find(item => item.id === prodotto.id);
    
    if (prodottoEsistente) {
        prodottoEsistente.quantity = (prodottoEsistente.quantity || 1) + 1;
    } else {
        prodotto.quantity = 1;
        carrello.push(prodotto);
    }
    
    salvaCarrello();  
    aggiornaInterfacciaCarrello();
    mostraToastAggiunto(prodotto.title); 
}

// Rimuovi prodotto
function rimuoviDalCarrello(idProdotto) {
    const indice = carrello.findIndex(prodotto => prodotto.id == idProdotto);
    if (indice !== -1) {
        const prodottoRimosso = carrello[indice];
        carrello.splice(indice, 1);
        salvaCarrello();
        aggiornaInterfacciaCarrello();
    }
}

// Modifica quantità
function modificaQuantita(idProdotto, nuovaQuantita) {
    const prodotto = carrello.find(item => item.id == idProdotto);
    if (prodotto) {
        if (nuovaQuantita <= 0) {
            rimuoviDalCarrello(idProdotto);
        } else {
            prodotto.quantity = nuovaQuantita; 
            salvaCarrello();
            aggiornaInterfacciaCarrello();
        }
    }
}

// Calcola totale
function calcolaTotale() {
    return carrello.reduce((totale, prodotto) => {
        return totale + (prodotto.price * (prodotto.quantity || 1));
    }, 0);
}

// Conta numero totale 
function contaArticoli() {
    return carrello.reduce((totale, prodotto) => {
        return totale + (prodotto.quantity || 1); 
    }, 0);
}

// Aggiorna carrello
function aggiornaInterfacciaCarrello() {
    const carrelloOffcanvas = document.querySelector('#cartOffcanvas .offcanvas-body');
    const numeroArticoli = contaArticoli();
    
    if (!carrelloOffcanvas) return;
    
    if (carrello.length === 0) {
        // Carrello vuoto
        carrelloOffcanvas.className = 'offcanvas-body mx-3 d-flex flex-column justify-content-center align-items-center carrello-vuoto';
        carrelloOffcanvas.innerHTML = `
            <div class="text-center h3 mb-3 text-decoration-none">Il tuo carrello è vuoto</div>
            <a class="btn btn-light" href="/catalogo" role="button">Continua lo shopping</a>
        `;
    } else {
        // Carrello con prodotti 
        carrelloOffcanvas.className = 'offcanvas-body mx-3';
        
        let htmlCarrello = '<div class="carrello-lista">';
        
        carrello.forEach(prodotto => {
            htmlCarrello += `
                <div class="carrello-item border-bottom p-3 bg-white rounded mb-2" data-id="${prodotto.id}">
                    <div class="row align-items-center text-black">
                        <div class="col-3">
                            ${prodotto.image ? `<img src="${prodotto.image}" class="img-fluid rounded" alt="${prodotto.title}">` : '<div class="bg-light rounded p-3 text-center">No img</div>'}
                        </div>
                        <div class="col-6">
                            <h6 class="mb-1">${prodotto.title}</h6>
                            <small class="text-muted">${prodotto.category}</small>
                            <div class="d-flex align-items-center mt-2">
                                <button class="btn btn-sm btn-outline text-black" onclick="modificaQuantita('${prodotto.id}', ${(prodotto.quantity || 1) - 1})">-</button>
                                <span class="mx-2">${prodotto.quantity || 1}</span>
                                <button class="btn btn-sm btn-outline text-black" onclick="modificaQuantita('${prodotto.id}', ${(prodotto.quantity || 1) + 1})">+</button>
                            </div>
                        </div>
                        <div class="col-3 text-end">
                            <div class="fw-bold">${(prodotto.price * (prodotto.quantity || 1)).toFixed(2)}€</div>
                            <button class="btn btn-sm btn-delete mt-1" onclick="rimuoviDalCarrello('${prodotto.id}')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        htmlCarrello += `
            </div>
            <div class="carrello-footer mt-4 bg-white rounded p-3 shadow-sm">
                <div class="row">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <strong class="text-dark fs-7">Totale: ${calcolaTotale().toFixed(2)}€</strong>
                            <small class="text-muted">${numeroArticoli} articol${numeroArticoli === 1 ? 'o' : 'i'}</small>
                        </div> 
                        <button class="btn btn-checkout w-100 mb-2 text-white" onclick="procediCheckout()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-credit-card me-2" viewBox="0 0 16 16">
                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"/>
                            </svg>
                            Procedi al checkout
                        </button>
                        <button class="btn btn-outline-secondary w-100" onclick="svuotaCarrello()">Svuota carrello</button>
                    </div>
                </div>
            </div>
        `;
        
        carrelloOffcanvas.innerHTML = htmlCarrello;
    }
    aggiornaBadgeCarrello();
}

// Aggiorna badge navbar
function aggiornaBadgeCarrello() {
    const numeroArticoli = contaArticoli();
    const bottoniCarrello = document.querySelectorAll('.btn-carrello');
    
    bottoniCarrello.forEach(bottone => {
        const badgeEsistente = bottone.querySelector('.badge');
        if (badgeEsistente) {
            badgeEsistente.remove();
        }
        
        if (numeroArticoli > 0) {
            const badge = document.createElement('span');
            badge.className = 'badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill';
            badge.style.fontSize = '0.7rem';
            badge.textContent = numeroArticoli > 99 ? '99+' : numeroArticoli;
            
            bottone.style.position = 'relative';
            bottone.appendChild(badge);
        }
    });
}

// Svuota carrello
function svuotaCarrello() {
    if (confirm('Sei sicuro di voler svuotare il carrello?')) {
        carrello = [];
        salvaCarrello();
        aggiornaInterfacciaCarrello();
    }
}

// Checkout 
function procediCheckout() {
    if (carrello.length === 0) {
        alert('Il carrello è vuoto! Aggiungi dei prodotti prima di procedere.');
        return;
    }
    
    salvaCarrello();
    
    window.location.href = '/checkout';
}

// Salva il carrello
function salvaCarrello() {
    try {
        localStorage.setItem('trainlyCart', JSON.stringify(carrello));
    } catch (error) {
        console.error('Errore nel salvare il carrello:', error);
    }
}

// Carica il carrello
function caricaCarrello() {
    try {
        const carrelloSalvato = localStorage.getItem('trainlyCart');
        if (carrelloSalvato) {
            carrello = JSON.parse(carrelloSalvato);
        } else {
            carrello = []; 
        }
    } catch (error) {
        console.error('Errore nel caricare il carrello:', error);
        carrello = []; 
    }
}

// Mostra toast quando un prodotto viene aggiunto
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
                <div class="toast-body">
                    "${nomeProdotto}" aggiunto al carrello!
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const nuovoToast = toastContainer.lastElementChild;
    
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toast = new bootstrap.Toast(nuovoToast, { delay: 3000 });
        toast.show();
        
        nuovoToast.addEventListener('hidden.bs.toast', () => {
            nuovoToast.remove();
        });
    } else {
        setTimeout(() => {
            if (nuovoToast && nuovoToast.parentNode) {
                nuovoToast.remove();
            }
        }, 3000);
    }
}


function ottieniCarrello() {
    return [...carrello]; 
}


function svuotaCarrelloSilenzioso() {
    carrello = [];
    salvaCarrello();
    aggiornaInterfacciaCarrello();
}


window.aggiungiAlCarrello = aggiungiAlCarrello;
window.rimuoviDalCarrello = rimuoviDalCarrello;
window.modificaQuantita = modificaQuantita;
window.svuotaCarrello = svuotaCarrello;
window.procediCheckout = procediCheckout;
window.ottieniCarrello = ottieniCarrello;
window.svuotaCarrelloSilenzioso = svuotaCarrelloSilenzioso;