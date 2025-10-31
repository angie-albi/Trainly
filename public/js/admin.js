// --- VARIABILI GLOBALI ---
let allProducts = [];
let allOrders = [];


// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', async () => {
    await fetchProducts();
    await fetchOrders(); 
    
    document.getElementById('searchInput').addEventListener('input', searchProducts);
    document.getElementById('orderSearchInput').addEventListener('input', searchOrders);
});

// --- INTERAZIONI CON CON LE API ---
// Caricamento dei prodotti 
async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            allProducts = data.data; 
            displayProducts(allProducts);
            updateStats();
        } else {
            showToast('Errore nel caricamento dei prodotti: ' + (data.message || 'formato dati non valido'), 'error');
        }
    } catch (err) {
        console.error('Errore fetchProducts:', err);
        showToast('Errore di connessione al server durante il caricamento dei prodotti', 'error');
    }
}

// Salvataggio o aggiornamento  di un prodotto
async function saveProductToServer(product, productId = null) {
    try {
        const res = await fetch(productId ? `/api/products/${productId}` : '/api/products', {
            method: productId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        return await res.json();
    } catch (err) {
        console.error('Errore salvataggio prodotto:', err);
        return { success: false, message: 'Errore di connessione durante il salvataggio del prodotto' };
    }
}

// Eliminazione  di un prodotto
async function deleteProductFromServer(productId) {
    try {
        const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        return await res.json();
    } catch (err) {
        console.error('Errore eliminazione prodotto:', err);
        showModal('Errore eliminazione prodotto', err.message || 'Errore di connessione durante l\'eliminazione del prodotto');
        return { success: false, message: 'Errore di connessione durante l\'eliminazione del prodotto' };
    }
}

// Caricamento degli ordini
async function fetchOrders() {
    try {
        const response = await fetch('/api/admin/orders');
        if (!response.ok) throw new Error(`Errore di rete o autorizzazione: ${response.statusText}`);
        
        const result = await response.json();
        if (result.success) {
            allOrders = result.orders;
            displayOrders(allOrders);
        } else {
            showToast(result.message || 'Impossibile caricare gli ordini', 'error');
        }
    } catch (error) {
        console.error('Errore nel fetch degli ordini:', error);
        const tableBody = document.getElementById('ordersTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    Impossibile caricare gli ordini. Controlla la connessione e i permessi.
                </td>
            </tr>`;
        }
    }
}

// --- GESTIONE INTERFACCIA ---
// Gestione dei prodotti
function displayProducts(productsToShow = allProducts) {
    const tbody = document.getElementById('productsTable');
    if (!tbody) return;

    tbody.innerHTML = '';

    // nessun prodotto trovato
    if (productsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    Nessun prodotto trovato
                </td>
            </tr>`;
        return;
    }

    // inserimento dei prodotti
    productsToShow.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="ps-3">
                <img src="${product.image_url || '/img/placeholder.png'}" 
                    alt="${product.name || ''}" 
                    style="width: 70px; height: 90px; object-fit: cover; " 
                    class="rounded"
                    onerror="this.src='/img/placeholder.png'">
            </td>
            <td> <strong>${product.name || ''}</strong> </td>
            <td> <span class="badge bg-${getCategoryColor(product.category)}">${getCategoryName(product.category)}</span> </td>
            <td> <strong>€${(product.price || 0).toFixed(2)}</strong> </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${product.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                    </svg>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3" viewBox="0 0 16 16">
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Gestione degli ordini
function displayOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    Nessun ordine trovato
                </td>
            </tr>`;
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        const orderDate = new Date(order.created_at).toLocaleDateString('it-IT', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        row.innerHTML = `
            <td class="ps-3"> <strong>#${order.id}</strong> </td>
            <td>${order.user_email}</td>
            <td>${orderDate}</td>
            <td> <span class="badge bg-${getStatusColor(order.status)}">${getStatusText(order.status)}</span> </td>
            <td> <strong>€${parseFloat(order.total).toFixed(2)}</strong> </td>
            <td>
                <a href="/confermaOrdine?orderId=${order.id}" class="btn btn-sm btn-custom text-white px-3" title="Vedi Dettagli">
                    <i class="bi bi-eye me-2"></i>
                        Dettagli
                </a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Aggiornamento delle statistiche
function updateStats() {
    const totalEl = document.getElementById('totalProducts');
    const programsEl = document.getElementById('totalPrograms');
    const coachingEl = document.getElementById('totalCoaching');
    const ebooksEl = document.getElementById('totalEbooks');

    if (totalEl) totalEl.textContent = allProducts.length;
    if (programsEl) programsEl.textContent = allProducts.filter(p => p.category === 'programma').length;
    if (coachingEl) coachingEl.textContent = allProducts.filter(p => p.category === 'coaching').length;
    if (ebooksEl) ebooksEl.textContent = allProducts.filter(p => p.category === 'ebook' || p.category === 'e-book').length;
}


// --- MODALI ---
// Apertura del modal per aggiunta di  un nuovo prodotto
function openAddModal() {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');
    const productId = document.getElementById('productId');

    if (title) title.textContent = 'Nuovo Prodotto';
    if (form) form.reset();
    if (productId) productId.value = '';
    
    new bootstrap.Modal(modal).show();
}

// Apertura del modal per modifica di  un prodotto
function editProduct(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) {
        showToast('Prodotto non trovato', 'error');
        return;
    }

    document.getElementById('modalTitle').textContent = 'Modifica Prodotto';
    document.getElementById('productId').value = product.id;
    document.getElementById('productTitle').value = product.name || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productPrice').value = product.price || 0;
    document.getElementById('productImage').value = product.image_url || '';
    document.getElementById('productDescription').value = product.description || '';

    const modal = document.getElementById('productModal');
    new bootstrap.Modal(modal).show();
}

// Mostra il modal 
function showModal(title, body, options = {}) {
    const { confirmText = 'OK', confirmClass = 'btn-primary text-white', onConfirm } = options;

    const existingModal = document.getElementById('dynamicModal');
    if (existingModal) existingModal.remove();

    const modalHtml = `
        <div class="modal fade" id="dynamicModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header admin-header text-white">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-black">${body}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Annulla</button>
                        <button type="button" class="btn ${confirmClass}" id="modalConfirmBtn">${confirmText}</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalEl = document.getElementById('dynamicModal');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const bsModal = new bootstrap.Modal(modalEl);

    if (onConfirm) {
        confirmBtn.addEventListener('click', () => {
            onConfirm();
            bsModal.hide();
        });
    } else {
        confirmBtn.addEventListener('click', () => bsModal.hide());
    }

    modalEl.addEventListener('hidden.bs.toast', () => modalEl.remove());
    
    bsModal.show();
}


// --- TOAST ---
// Mostra il toast
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toastEl || !toastMessage) {
        alert(message);
        return;
    }

    toastMessage.textContent = message;
    toastEl.className = `toast align-items-center text-bg-${type === 'error' ? 'danger' : 'success'} border-0`;
    
    if (typeof bootstrap !== 'undefined') {
        new bootstrap.Toast(toastEl).show();
    }
}


// --- FUNZIONALITA DELL'ADMIN ---
// Salvataggio di un prodotto (nuovo o modificato)
async function saveProduct() {
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    form.classList.remove('was-validated');

    const productId = document.getElementById('productId').value;
    let imageUrl = document.getElementById('productImage').value.trim();
    
    // Aggiunge il percorso base dell'immagine se non è un URL completo
    if (imageUrl && !imageUrl.startsWith('/img/') && !imageUrl.startsWith('http')) {
        imageUrl = `/img/${imageUrl}`;
    }

    const productData = {
        name: document.getElementById('productTitle').value.trim(),
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        image_url: imageUrl,
        description: document.getElementById('productDescription').value.trim(),
        available: 1 
    };

    const result = await saveProductToServer(productData, productId || null);

    if (result.success) {
        showToast(productId ? 'Prodotto aggiornato con successo!' : 'Prodotto creato con successo!');
        bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
        await fetchProducts(); 
    } else {
        showToast(result.message || 'Errore durante il salvataggio', 'error');
    }
}

// Eliminazione di un prodotto 
function deleteProduct(productId) {
    showModal(
        'Conferma eliminazione',
        'Sei sicuro di voler eliminare questo prodotto? L\'azione è irreversibile.', {
            confirmText: 'Elimina',
            confirmClass: 'btn-danger text-white',
            onConfirm: () => confirmDeleteProduct(productId)
        }
    );
}
// Conferma l'eliminazione di un prodotto
async function confirmDeleteProduct(productId) {
    const result = await deleteProductFromServer(productId);

    if (result.success) {
        showToast('Prodotto eliminato con successo!');
        await fetchProducts();
    } else {
        showToast(result.message || 'Errore durante l\'eliminazione', 'error');
    }
}

// Ricerca di un prodotto
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const term = searchInput.value.toLowerCase().trim();
    if (!term) {
        displayProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(product => {
        const title = (product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        
        return title.includes(term) || 
               description.includes(term) || 
               category.includes(term);
    });

    displayProducts(filtered);
}

// Ricerca di un ordine
function searchOrders() {
    const searchInput = document.getElementById('orderSearchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredOrders = !searchTerm
        ? allOrders
        : allOrders.filter(order => 
            String(order.id).includes(searchTerm) || 
            order.user_email.toLowerCase().includes(searchTerm)
          );

    displayOrders(filteredOrders);
}


// ---FUNZIONI DI SUPPORTO ---
// Classificazione delle categorie in colori e nomi
function getCategoryColor(category) {
    const colors = {
        programma: 'success',
        coaching: 'info',
        ebook: 'warning',
        'e-book': 'warning'
    };
    return colors[category] || 'secondary';
}
// Restituisce il nome leggibile della categoria
function getCategoryName(category) {
    const names = {
        programma: 'Programma',
        coaching: 'Coaching',
        ebook: 'E-book',
        'e-book': 'E-book'
    };
    return names[category] || category || 'N/A';
}

// Classificazione degli stati degli ordini in colori e testi
function getStatusColor(status) {
    const colors = { 
        'confermato': 'success', 
        'pending': 'warning', 
        'cancelled': 'danger' 
    };
    return colors[status] || 'secondary';
}
// Restituisce il testo leggibile dello stato  
function getStatusText(status) {
    const texts = { 
        'confermato': 'Confermato', 
        'pending': 'In Attesa', 
        'cancelled': 'Annullato' 
    };
    return texts[status] || status;
}