// admin.js – Gestione prodotti collegata al backend (DB)

let products = [];

// ───────── API ─────────
async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success) {
            products = data.products || data.data || [];
            displayProducts();
            updateStats();
        } else {
            showToast('Errore nel caricamento prodotti', 'error');
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
        return { success: false, message: 'Errore server' };
    }
}

async function deleteProductFromServer(productId) {
    try {
        const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        return await res.json();
    } catch (err) {
        console.error('Errore eliminazione prodotto:', err);
        return { success: false, message: 'Errore server' };
    }
}

// ───────── UI ─────────
function displayProducts(productsToShow = products) {
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
            <td>
                <img src="${product.image_url || product.image || '/assest/img/placeholder.png'}" 
                     alt="${product.name || product.title || ''}" 
                     style="width: 50px; height: 50px; object-fit: cover;" 
                     class="rounded"
                     onerror="this.src='/assest/img/placeholder.png'">
            </td>
            <td><strong>${product.name || product.title || ''}</strong></td>
            <td><span class="badge bg-${getCategoryColor(product.category)}">${getCategoryName(product.category)}</span></td>
            <td><strong>€${(product.price || 0).toFixed(2)}</strong></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct(${product.id})">✏️</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})">🗑️</button>
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

    if (totalEl) totalEl.textContent = products.length;
    if (programsEl) programsEl.textContent = products.filter(p => p.category === 'programma').length;
    if (coachingEl) coachingEl.textContent = products.filter(p => p.category === 'coaching').length;
    if (ebooksEl) ebooksEl.textContent = products.filter(p => p.category === 'ebook' || p.category === 'e-book').length;
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
    const product = products.find(p => p.id == productId);
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
    if (elements.productTitle) elements.productTitle.value = product.name || product.title || '';
    if (elements.productCategory) elements.productCategory.value = product.category || '';
    if (elements.productPrice) elements.productPrice.value = product.price || 0;
    if (elements.productImage) elements.productImage.value = product.image_url || product.image || '';
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
        form.reportValidity();
        return;
    }

    const elements = {
        productId: document.getElementById('productId'),
        productTitle: document.getElementById('productTitle'),
        productCategory: document.getElementById('productCategory'),
        productPrice: document.getElementById('productPrice'),
        productImage: document.getElementById('productImage'),
        productDescription: document.getElementById('productDescription')
    };

    const productId = elements.productId ? elements.productId.value : '';
    const productData = {
        name: elements.productTitle ? elements.productTitle.value.trim() : '',
        title: elements.productTitle ? elements.productTitle.value.trim() : '', // Compatibilità
        category: elements.productCategory ? elements.productCategory.value : '',
        price: elements.productPrice ? parseFloat(elements.productPrice.value) || 0 : 0,
        image_url: elements.productImage ? elements.productImage.value.trim() : '',
        image: elements.productImage ? elements.productImage.value.trim() : '', // Compatibilità
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
            
            await fetchProducts(); // Ricarica i prodotti
        } else {
            showToast(result?.message || 'Errore salvataggio prodotto', 'error');
        }
    } catch (error) {
        console.error('Errore in saveProduct:', error);
        showToast('Errore durante il salvataggio', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;

    try {
        const result = await deleteProductFromServer(productId);

        if (result && result.success) {
            showToast('Prodotto eliminato!');
            await fetchProducts(); // Ricarica i prodotti
        } else {
            showToast(result?.message || 'Errore eliminazione prodotto', 'error');
        }
    } catch (error) {
        console.error('Errore in deleteProduct:', error);
        showToast('Errore durante l\'eliminazione', 'error');
    }
}

// ───────── UI PRODOTTI ─────────
function displayProducts(productsToShow = products) {
    // ... il tuo codice esistente per mostrare i prodotti ...
}

function updateStats() {
    // ... il tuo codice esistente per le statistiche ...
}

// ... (tutte le altre funzioni per UI prodotti e CRUD restano invariate) ...

// ========================================
// NUOVE FUNZIONI PER LA GESTIONE ORDINI
// ========================================

// Funzione per recuperare tutti gli ordini dall'API
async function fetchOrders() {
    try {
        const response = await fetch('/api/admin/orders');
        if (!response.ok) throw new Error('Errore di rete o autorizzazione');
        
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
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Impossibile caricare gli ordini.</td></tr>`;
        }
    }
}

// Funzione per mostrare gli ordini nella tabella
function displayOrders(orders) {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // Pulisce la tabella

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Nessun ordine trovato.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        const orderDate = new Date(order.created_at).toLocaleDateString('it-IT', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        row.innerHTML = `
            <td><strong>#${order.id}</strong></td>
            <td>${order.user_email}</td>
            <td>${orderDate}</td>
            <td><span class="badge bg-${getStatusColor(order.status)}">${getStatusText(order.status)}</span></td>
            <td><strong>€${parseFloat(order.total).toFixed(2)}</strong></td>
            <td>
                <a href="/confermaOrdine?orderId=${order.id}" class="btn btn-sm btn-outline-primary" title="Vedi Dettagli">
                    <i class="bi bi-eye"></i> Dettagli
                </a>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Funzione di ricerca per gli ordini
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

// Helpers per lo stato degli ordini
function getStatusColor(status) {
    const colors = { 'confermato': 'success', 'pending': 'warning', 'cancelled': 'danger' };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const texts = { 'confermato': 'Confermato', 'pending': 'In Attesa', 'cancelled': 'Annullato' };
    return texts[status] || status;
}

// ───────── TOAST + LOGOUT ─────────
function showToast(message, type = 'success') {
    const toastEl = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toastEl || !toastMessage) {
        console.warn('Elementi toast non trovati, uso alert:', message);
        alert(message);
        return;
    }

    toastMessage.textContent = message;
    toastEl.className = `toast align-items-center text-bg-${type === 'error' ? 'danger' : 'success'} border-0`;
    
    if (typeof bootstrap !== 'undefined') {
        new bootstrap.Toast(toastEl).show();
    }
}

function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        window.location.href = '/logout';
    }
}

// ───────── SEARCH ─────────
function searchProducts() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const term = searchInput.value.toLowerCase().trim();
    if (!term) {
        displayProducts(); // Mostra tutti i prodotti
        return;
    }

    const filtered = products.filter(product => {
        const name = (product.name || product.title || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        
        return name.includes(term) || 
               description.includes(term) || 
               category.includes(term);
    });

    displayProducts(filtered);
}

document.addEventListener('DOMContentLoaded', async () => {
    
    // Carica sia i prodotti che gli ordini all'avvio
    await fetchProducts();
    await fetchOrders(); 
    
    // Setup ricerca prodotti
    const productSearchInput = document.getElementById('searchInput');
    if (productSearchInput) {
        productSearchInput.addEventListener('input', searchProducts);
        // ... (resto del setup per la ricerca prodotti) ...
    }

    // Setup ricerca ordini
    const orderSearchInput = document.getElementById('orderSearchInput');
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', searchOrders);
        orderSearchInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchOrders();
            }
        });
    }
});