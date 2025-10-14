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

// Carica il carrello 
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
                        carrello = data.items.map(item => ({
                            id: item.product_id.toString(),
                            title: item.name,
                            price: parseFloat(item.price),
                            category: '', 
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

// Aggiorna il carrello 
async function aggiungiAlCarrello(prodotto) {
    const prodottoEsistente = carrello.find(item => item.id === prodotto.id);
    
    if (prodottoEsistente) {
        prodottoEsistente.quantity = (prodottoEsistente.quantity || 1) + 1;
    } else {
        prodotto.quantity = 1;
        carrello.push(prodotto);
    }
    
    // Salva nel localStorage come backup per utenti non registrati
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

// Rimuove prodotto dal carrello
async function rimuoviDalCarrello(idProdotto) {
    const indice = carrello.findIndex(prodotto => prodotto.id == idProdotto);
    if (indice !== -1) {
        const prodottoRimosso = carrello[indice];
        carrello.splice(indice, 1);
        
        // Salva nel localStorage per utneti non registrati
        salvaCarrello();
        
        // Se l'utente è autenticato, rimuovi anche dal database
        if (isUserAuthenticated) {
            try {
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

// Modifca quantita prodotto
async function modificaQuantita(idProdotto, nuovaQuantita) {
    const prodotto = carrello.find(item => item.id == idProdotto);
    if (prodotto) {
        if (nuovaQuantita <= 0) {
            rimuoviDalCarrello(idProdotto);
        } else {
            prodotto.quantity = nuovaQuantita;
            
            // Salva nel localStorage per utenti non registrati
            salvaCarrello();
            
            // Se l'utente è autenticato, aggiorna anche nel database
            if (isUserAuthenticated) {
                try {
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

// Sincronizzazione carrello al login
async function sincronizzaCarrelloAlLogin() {
    const isAuthenticated = await checkAuthStatus();
    
    if (isAuthenticated && carrello.length > 0) {
        try {
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