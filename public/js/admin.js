let allProducts = [];
let allOrders = [];

// ───────── API ─────────
async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
            allProducts = data.data; // Usa data.data come fornito dall'API
            displayProducts(allProducts);
            updateStats();
        } else {
            showToast('Errore nel caricamento dei prodotti: ' + (data.message || 'formato dati non valido'), 'error');
        }
    } catch (err) {
        console.error('Errore fetchProducts:', err);
        showToast('Errore di connessione al server', 'error');
    }
}

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
        return { success: false, message: 'Errore di connessione durante il salvataggio' };
    }
}

async function deleteProductFromServer(productId) {
    try {
        const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        return await res.json();
    } catch (err) {
        console.error('Errore eliminazione prodotto:', err);
        showErrorModal('Errore eliminazione prodotto', err.message || 'Errore di connessione durante l\'eliminazione');
        return { success: false, message: 'Errore di connessione durante l\'eliminazione' };
    }
}

function showErrorModal(title, message) {
    if (!document.getElementById('errorModal')) {
        const modalHtml = `
            <div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title" id="errorModalLabel">Errore</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-black">
                            <p id="errorModalMessage"></p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Chiudi</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const modal = document.getElementById('errorModal');
    const messageEl = document.getElementById('errorModalMessage');
    const titleEl = modal.querySelector('.modal-title');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// ───────── UI ─────────
function displayProducts(productsToShow = allProducts) {
    const tbody = document.getElementById('productsTable');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (productsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    Nessun prodotto trovato
                </td>
            </tr>
        `;
        return;
    }

    productsToShow.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="ps-3">
                <img src="${product.image || '/img/placeholder.png'}" 
                     alt="${product.title || ''}" 
                     style="width: 70px; height: 70px; object-fit: cover; " 
                     class="rounded"
                     onerror="this.src='/img/placeholder.png'">
            </td>
            <td><strong>${product.title || ''}</strong></td>
            <td><span class="badge bg-${getCategoryColor(product.category)}">${getCategoryName(product.category)}</span></td>
            <td><strong>€${(product.price || 0).toFixed(2)}</strong></td>
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

function getCategoryColor(category) {
    const colors = {
        programma: 'success',
        coaching: 'info',
        ebook: 'warning',
        'e-book': 'warning'
    };
    return colors[category] || 'secondary';
}

function getCategoryName(category) {
    const names = {
        programma: 'Programma',
        coaching: 'Coaching',
        ebook: 'E-book',
        'e-book': 'E-book'
    };
    return names[category] || category || 'N/A';
}

// ───────── CRUD ─────────
function openAddModal() {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('productForm');
    const productId = document.getElementById('productId');

    if (title) title.textContent = 'Nuovo Prodotto';
    if (form) form.reset();
    if (productId) productId.value = '';
    
    if (modal && typeof bootstrap !== 'undefined') {
        new bootstrap.Modal(modal).show();
    }
}

function editProduct(productId) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) {
        showToast('Prodotto non trovato', 'error');
        return;
    }

    const elements = {
        modalTitle: document.getElementById('modalTitle'),
        productId: document.getElementById('productId'),
        productTitle: document.getElementById('productTitle'),
        productCategory: document.getElementById('productCategory'),
        productPrice: document.getElementById('productPrice'),
        productImage: document.getElementById('productImage'),
        productDescription: document.getElementById('productDescription')
    };

    if (elements.modalTitle) elements.modalTitle.textContent = 'Modifica Prodotto';
    if (elements.productId) elements.productId.value = product.id;
    if (elements.productTitle) elements.productTitle.value = product.title || '';
    if (elements.productCategory) elements.productCategory.value = product.category || '';
    if (elements.productPrice) elements.productPrice.value = product.price || 0;
    if (elements.productImage) elements.productImage.value = product.image || '';
    if (elements.productDescription) elements.productDescription.value = product.description || '';

    const modal = document.getElementById('productModal');
    if (modal && typeof bootstrap !== 'undefined') {
        new bootstrap.Modal(modal).show();
    }
}

async function saveProduct() {
    const form = document.getElementById('productForm');
    if (!form) return;

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    form.classList.remove('was-validated');

    const elements = {
        productId: document.getElementById('productId'),
        productTitle: document.getElementById('productTitle'),
        productCategory: document.getElementById('productCategory'),
        productPrice: document.getElementById('productPrice'),
        productImage: document.getElementById('productImage'),
        productDescription: document.getElementById('productDescription'),
        available: 1,
    };

    const productId = elements.productId ? elements.productId.value : '';
    const productData = {
        name: elements.productTitle ? elements.productTitle.value.trim() : '', // L'API si aspetta 'name'
        category: elements.productCategory ? elements.productCategory.value : '',
        price: elements.productPrice ? parseFloat(elements.productPrice.value) || 0 : 0,
        image_url: elements.productImage ? elements.productImage.value.trim() : '', // L'API si aspetta 'image_url'
        description: elements.productDescription ? elements.productDescription.value.trim() : ''
    };

    try {
        const result = await saveProductToServer(productData, productId || null);

        if (result && result.success) {
            showToast(productId ? 'Prodotto aggiornato!' : 'Prodotto aggiunto!');
            
            const modal = document.getElementById('productModal');
            if (modal && typeof bootstrap !== 'undefined') {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) modalInstance.hide();
            }
            
            await fetchProducts();
        } else {
            showToast(result?.message || 'Errore durante il salvataggio del prodotto', 'error');
        }
    } catch (error) {
        console.error('Errore in saveProduct:', error);
        showToast('Errore critico durante il salvataggio', 'error');
    }
}

function showDeleteConfirmationModal(productId) {
    if (!document.getElementById('deleteProductModal')) {
        const modalHtml = `
            <div class="modal fade" id="deleteProductModal" tabindex="-1" aria-labelledby="deleteProductModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header text-white">
                            <h5 class="modal-title" id="deleteProductModalLabel">Conferma eliminazione</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-black">
                            Sei sicuro di voler eliminare questo prodotto? <br> L'azione è irreversibile.
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-confirm-delete text-white" onclick="confirmDeleteProduct(this.getAttribute('data-product-id'))">Elimina</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const modal = document.getElementById('deleteProductModal');
    const confirmButton = modal.querySelector('.btn-confirm-delete');
    confirmButton.setAttribute('data-product-id', productId);
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

function deleteProduct(productId) {
    showDeleteConfirmationModal(productId);
}

async function confirmDeleteProduct(productId) {
    try {
        const modal = document.getElementById('deleteProductModal');
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();

        const result = await deleteProductFromServer(productId);

        if (result && result.success) {
            showToast('Prodotto eliminato!');
            await fetchProducts();
        } else {
            showToast(result?.message || 'Errore durante l\'eliminazione del prodotto', 'error');
        }
    } catch (error) {
        console.error('Errore in deleteProduct:', error);
        showToast('Errore critico durante l\'eliminazione', 'error');
    }
}


// ========================================
// FUNZIONI PER LA GESTIONE ORDINI
// ========================================

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
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Impossibile caricare gli ordini. Controlla la connessione e i permessi.</td></tr>`;
        }
    }
}

function displayOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Nessun ordine trovato</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        const orderDate = new Date(order.created_at).toLocaleDateString('it-IT', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        row.innerHTML = `
            <td class="ps-3"><strong>#${order.id}</strong></td>
            <td>${order.user_email}</td>
            <td>${orderDate}</td>
            <td><span class="badge bg-${getStatusColor(order.status)}">${getStatusText(order.status)}</span></td>
            <td><strong>€${parseFloat(order.total).toFixed(2)}</strong></td>
            <td>
                <a href="/confermaOrdine?orderId=${order.id}" class="btn btn-sm btn-custom text-white px-3" title="Vedi Dettagli">
                    <i class="bi bi-eye me-2"></i>Dettagli
                </a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

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

function getStatusColor(status) {
    const colors = { 'confermato': 'success', 'pending': 'warning', 'cancelled': 'danger' };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = { 'confermato': 'Confermato', 'pending': 'In Attesa', 'cancelled': 'Annullato' };
    return texts[status] || status;
}

// ───────── TOAST ─────────
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

// ───────── SEARCH ─────────
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const term = searchInput.value.toLowerCase().trim();
    if (!term) {
        displayProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter(product => {
        const title = (product.title || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        
        return title.includes(term) || 
               description.includes(term) || 
               category.includes(term);
    });

    displayProducts(filtered);
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchProducts();
    await fetchOrders(); 
    
    const productSearchInput = document.getElementById('searchInput');
    if (productSearchInput) {
        productSearchInput.addEventListener('input', searchProducts);
    }

    const orderSearchInput = document.getElementById('orderSearchInput');
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', searchOrders);
    }
});