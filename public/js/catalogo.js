// --- VARIABILI GLOBALI ---
let allProducts = [];
let filteredProducts = [];
let activeFilters = {};
let isLoading = false;

// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', function() {
    initializeCatalog();

        document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'show-all-btn' || e.target.id === 'show-all-btn-mobile')) {
            resetAllFilters();
        }
    });
});

// --- FUNZIONI PRINCIPALI ---
// Inizializzazione del catalogo
async function initializeCatalog() {
    showLoadingState();
    await loadProducts();
    setupEventListeners(); 

    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('categoria');
    const searchTermFromUrl = urlParams.get('search');

    if (categoryFromUrl) {
        filterByCategory(categoryFromUrl);
        updateActiveFilterDisplay();
    } else if (searchTermFromUrl) {
        const searchInput = document.querySelector('.form-search, input[type="search"]');
        if (searchInput) {
            searchInput.value = searchTermFromUrl;
        }
        searchProducts(searchTermFromUrl);
    }

    hideLoadingState();
}

// Caricamento dei prodotti
async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        const result = await response.json();

        if (result && result.success && Array.isArray(result.data)) {
            allProducts = result.data.map(p => ({ 
                id: String(p.id || p._id || ''),
                title: p.title || p.name || '',
                description: p.description || '',
                category: p.category || '',
                price: (typeof p.price === 'number') ? p.price : parseFloat(p.price) || 0,
                image: p.image || p.image_url || '/assest/img/placeholder.png'
            }));
            filteredProducts = [...allProducts];
            displayProducts(); 
            updateProductCount();
            toggleShowAllButton();
        } else {
            console.warn('Risposta API prodotti non valida', result);
            showErrorMessage('Nessun prodotto disponibile.');
        }
    } catch (error) {
        console.error("Errore nel caricamento prodotti:", error);
        showErrorMessage('Errore nel caricamento dei prodotti. Riprova più tardi.');
    }
}

// Visualizzazione dei prodotti
function displayProducts(products) {
    if (!products) products = filteredProducts;

    const container = document.getElementById('products-container');
    if (!container) {
        console.error('Container prodotti non trovato');
        return;
    }

    container.innerHTML = '';

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <h5>Nessun prodotto trovato</h5>
                    <p class="mb-0">Prova a modificare i filtri di ricerca</p>
                </div>
            </div>
        `;
        toggleShowAllButton();
        return;
    }

    const frag = document.createDocumentFragment();
    products.forEach(p => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = createProductCard(p).trim();
        frag.appendChild(wrapper.firstElementChild);
    });

    container.appendChild(frag);

    addCartButtonListeners();

    updateProductCount();
    toggleShowAllButton();
}

// Crea la singola card del prodotto
function createProductCard(product) {
    const title = product.title || '';
    const desc = product.description || '';
    const img = product.image || '/img/placeholder.png';
    const price = (typeof product.price === 'number') ? product.price : parseFloat(product.price) || 0;
    const id = product.id || '';

    return `
    <div class="col product-item">
      <div class="card h-100 shadow-sm product-card" data-product-id="${id}" data-category="${product.category || ''}" data-price="${price}">
        <img src="${img}" class="card-img-top" alt="${escapeHtml(title)}" loading="lazy">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${escapeHtml(title)}</h5>
          <p class="card-text">${escapeHtml(truncateText(desc, 400))}</p>
        </div>
        <div class="card-footer bg-transparent">
          <div class="d-flex justify-content-between text-end mb-2">
            <strong class="text-primary fs-5">€ ${price.toFixed(2)}</strong>
          </div>
          <button class="btn w-100 btn-carrello-aggiungi text-white" data-id="${id}" aria-label="Aggiungi ${escapeHtml(title)} al carrello">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cart-plus me-2" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M9 5.5a.5.5 0 0 0-1 0V7H6.5a.5.5 0 0 0 0 1H8v1.5a.5.5 0 0 0 1 0V8h1.5a.5.5 0 0 0 0-1H9z"/>
              <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1zm3.915 10L3.102 4h10.796l-1.313 7z"/>
            </svg>
            Aggiungi al carrello
          </button>
        </div>
      </div>
    </div>
    `;
}

function truncateText(str, maxLen) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen).trim() + '...';
}

function escapeHtml(text) {
    if (text === undefined || text === null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}



// Filtri
function matchesFilters(product) {
    // categoria
    if (activeFilters.category && product.category !== activeFilters.category) {
        return false;
    }

    // prezzo
    if (activeFilters.price) {
        const price = parseFloat(product.price) || 0;
        if (price < activeFilters.price.min || price > activeFilters.price.max) return false;
    }

    // ricerca
    if (activeFilters.search) {
        const term = activeFilters.search.toLowerCase();
        const productText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
        if (!productText.includes(term)) return false;
    }

    return true;
}

function filterByCategory(category) {
    if (!category || category === 'all') {
        delete activeFilters.category;
    } else {
        activeFilters.category = category;
    }
    applyFilters();
}

function filterByPrice(minPrice, maxPrice) {
    const min = minPrice ? parseFloat(minPrice) : 0;
    const max = maxPrice ? parseFloat(maxPrice) : Infinity;
    if (!isFinite(min) || !isFinite(max) || (minPrice && maxPrice && min > max)) {
        showPriceError('Il prezzo minimo non può essere maggiore del prezzo massimo');
        return;
    }

    if (minPrice || maxPrice) activeFilters.price = { min, max };
    else delete activeFilters.price;

    applyFilters();
}

// Ricerca del prodotto
function searchProducts(term) {
    const keyword = (term || '').toLowerCase().trim();
    if (!keyword) delete activeFilters.search;
    else activeFilters.search = keyword;
    debouncedApplyFilters();
}

function applyFilters() {
    filteredProducts = allProducts.filter(p => matchesFilters(p));
    displayProducts();
    updateProductCount();     
    toggleShowAllButton();    
}

function debounce(fn, wait = 300) {
    let t;
    return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

const debouncedApplyFilters = debounce(applyFilters, 250);

function setupEventListeners() {
    document.querySelectorAll('[data-category-filter]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category-filter');
            filterByCategory(category);
            updateActiveFilterDisplay();
        });
    });

    setupPriceFilters();
    setupSearch();
    setupResetFilters();

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortProducts(this.value);
        });
    }
}

function setupResetFilters() {
    const desktopSidebar = document.querySelector('.sidenav');
    if (desktopSidebar && !desktopSidebar.querySelector('#show-all-btn')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'text-center m-3';
        wrapper.innerHTML = `
            <button id="show-all-btn" class="btn btn-custom text-white d-none w-100">
                Mostra tutti
            </button>
        `;
        desktopSidebar.appendChild(wrapper);
    }

    const mobileOffcanvas = document.querySelector('#filterOffcanvas .offcanvas-body');
    if (mobileOffcanvas && !mobileOffcanvas.querySelector('#show-all-btn-mobile')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'text-center mt-4';
        wrapper.innerHTML = `
            <button id="show-all-btn-mobile" class="btn btn-light d-none w-100">
                Mostra tutti
            </button>
        `;
        mobileOffcanvas.appendChild(wrapper);
    }
}

// Mostra tutti 
function toggleShowAllButton() {
    const hasFilters = Object.keys(activeFilters).length > 0;
    
    const desktopBtn = document.getElementById('show-all-btn');
    if (desktopBtn) {
        desktopBtn.classList.toggle('d-none', !hasFilters);
    }
    
    const mobileBtn = document.getElementById('show-all-btn-mobile');
    if (mobileBtn) {
        mobileBtn.classList.toggle('d-none', !hasFilters);
    }
}

function setupSearch() {
    const inputs = document.querySelectorAll('.form-search, input[type="search"]');
    if (!inputs) return;
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            searchProducts(this.value);
        });
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchProducts(this.value);
            }
        });
    });

    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent && btn.textContent.trim().toLowerCase().includes('cerca')) {
            btn.addEventListener('click', () => {
                const input = document.querySelector('.form-search, input[type="search"]');
                if (input) searchProducts(input.value);
            });
        }
    });
}

function setupPriceFilters() {
    document.querySelectorAll('.bi-arrow-right-square, .bi-arrow, [data-price-apply]').forEach(btn => {
        if (btn._priceBound) return;
        btn._priceBound = true;

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const container = this.closest('.container-fluid, .row, .offcanvas-body, .sidenav');
            const minInput = container && container.querySelector('input[placeholder*="minimo"]');
            const maxInput = container && container.querySelector('input[placeholder*="massimo"]');
            filterByPrice(minInput ? minInput.value : '', maxInput ? maxInput.value : '');
        });
    });

    document.querySelectorAll('input[placeholder*="minimo"], input[placeholder*="massimo"]').forEach(input => {
        if (input._enterBound) return;
        input._enterBound = true;

        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const container = this.closest('.container-fluid, .row, .offcanvas-body, .sidenav');
                const minInput = container && container.querySelector('input[placeholder*="minimo"]');
                const maxInput = container && container.querySelector('input[placeholder*="massimo"]');
                filterByPrice(minInput ? minInput.value : '', maxInput ? maxInput.value : '');
            }
        });
    });
}

function sortProducts(sortBy) {
    switch (sortBy) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        default:
            filteredProducts = [...allProducts];
    }
    displayProducts();
    toggleShowAllButton();
}

function addCartButtonListeners() {
    document.querySelectorAll('.btn-carrello-aggiungi, .add-to-cart-btn').forEach(button => {
        if (button._listenerAttached) return;
        button._listenerAttached = true;

        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.dataset.id || this.getAttribute('data-product-id');
            const card = this.closest('.card');
            const productName = card ? (card.querySelector('.card-title')?.textContent || '') : '';
            const productPrice = card ? parseFloat(card.dataset.price || 0) : 0;

            if (typeof addToCart === 'function') {
                addToCart(productId, productName, productPrice);
            } else if (typeof aggiungiAlCarrello === 'function') {
                const product = allProducts.find(p => p.id === productId);
                if (product) {
                    aggiungiAlCarrello({
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        category: product.category,
                        image: product.image,  
                        quantity: 1
                    });
                }
            }

            const original = this.innerHTML;
            this.innerHTML = '<i class="bi bi-check me-1"></i> Aggiunto!';
            this.classList.add('btn-success');
            setTimeout(() => {
                this.innerHTML = original;
                this.classList.remove('btn-success');
            }, 1200);
        });
    });
}

// --- FUNZIONI ---
function updateProductCount() {
    const el = document.getElementById('product-count');
    if (!el) return;
    const count = filteredProducts.length;
    const total = allProducts.length;
    el.textContent = `${count} prodott${count === 1 ? 'o' : 'i'}` + (count !== total ? ` (su ${total} totali)` : '');
}

function updateActiveFilterDisplay() {
    document.querySelectorAll('[data-category-filter]').forEach(link => {
        const cat = link.getAttribute('data-category-filter');
        if (activeFilters.category && activeFilters.category === cat) {
            link.classList.add('fw-bold', 'text-primary');
        } else {
            link.classList.remove('fw-bold', 'text-primary');
        }
    });
}

function showPriceError(message = 'Il prezzo minimo non può essere maggiore del prezzo massimo.') {
    const toastElement = document.getElementById('priceToast');
    if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        const body = toastElement.querySelector('.toast-body');
        if (body) body.textContent = message;
        toast.show();
    } else {
        alert(message);
    }
}

function showLoadingState() {
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Caricamento...</span></div>
                <p class="mt-3 text-muted">Caricamento prodotti...</p>
            </div>
        `;
    }
}

function hideLoadingState() {
    // displayProducts si occupa di sovrascrivere il contenuto
}

function showErrorMessage(message) {
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="text-danger">
                    <i class="bi bi-exclamation-triangle mb-3" style="font-size: 3rem;"></i>
                    <h4>Errore</h4>
                    <p>${escapeHtml(message)}</p>
                    <button class="btn btn-primary btn-custom mt-3" onclick="location.reload()">Riprova</button>
                </div>
            </div>
        `;
    }
}

function getCategoryName(category) {
    const categoryNames = {
        'programma': 'Programmi',
        'coaching': 'Coaching',
        'ebook': 'E-books'
    };
    return categoryNames[category] || (category || '');
}

function clearSearch() {
    delete activeFilters.search;
    filteredProducts = [...allProducts];
    displayProducts();
    updateProductCount();
    toggleShowAllButton();

    const searchInput = document.querySelector('.form-search, input[type="search"]');
    if (searchInput) searchInput.value = '';
}

function resetAllFilters() {
    activeFilters = {};
    filteredProducts = [...allProducts];

    document.querySelectorAll('input[placeholder="minimo"], input[placeholder="massimo"]').forEach(input => {
        input.value = '';
    });

    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) searchInput.value = '';

    const searchMessage = document.getElementById('search-message');
    if (searchMessage) {
        searchMessage.textContent = '';
    }

    document.querySelectorAll('[data-category-filter]').forEach(link => {
        link.classList.remove('fw-bold', 'text-primary');
    });

    // Aggiorna UI
    displayProducts();
    updateProductCount();
    updateActiveFilterDisplay();
    toggleShowAllButton();
}

// --- FUNZIONI GLOBALI ---
window.loadProducts = loadProducts;
window.filterByCategory = filterByCategory;
window.filterByPrice = filterByPrice;
window.searchProducts = searchProducts;
window.clearSearch = clearSearch;
window.sortProducts = sortProducts;
window.resetAllFilters = resetAllFilters;