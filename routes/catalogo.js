/* === REPLACE / UPDATE THESE FUNCTIONS IN catalogo.js === */

/* displayProducts: assicurati che lo stato filteredProducts sia sempre coerente */
function displayProducts(products) {
    // se chiamata con un array, salvalo anche nello stato
    if (!products) products = filteredProducts;
    // mantieni lo stato coerente: ciò che mostri è ciò che conteggi
    filteredProducts = Array.isArray(products) ? products : [];

    const container = document.getElementById('products-container');
    if (!container) {
        console.error('Container prodotti non trovato');
        return;
    }

    container.innerHTML = '';

    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <h5>Nessun prodotto trovato</h5>
                    <p class="mb-0">Prova a modificare i filtri di ricerca</p>
                </div>
            </div>`;
        updateProductCount();
        toggleShowAllButton();
        return;
    }

    const frag = document.createDocumentFragment();
    filteredProducts.forEach(p => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = createProductCard(p).trim();
        frag.appendChild(wrapper.firstElementChild);
    });

    container.appendChild(frag);

    addCartButtonListeners();
    updateProductCount();
    toggleShowAllButton();
}

/* setupEventListeners: collega sia i link desktop che quelli nell'offcanvas/mobile */
function setupEventListeners() {
    // categoria: prendi tutti i possibili selettori (data-category-filter e .sidenav-link presenti in desktop e mobile)
    document.querySelectorAll('[data-category-filter], .sidenav-link').forEach(link => {
        if (link._categoryBound) return; // evita doppio binding
        link._categoryBound = true;

        link.addEventListener('click', function(e) {
            e.preventDefault();
            // preferisci l'attributo esplicito
            const category = this.getAttribute('data-category-filter') || this.dataset.category || this.textContent.trim().toLowerCase();
            filterByCategory(category);
            updateActiveFilterDisplay();

            // se siamo in mobile, chiudi l'offcanvas se è aperto
            const offEl = document.getElementById('filterOffcanvas');
            if (offEl) {
                const instance = bootstrap.Offcanvas.getInstance(offEl);
                if (instance) instance.hide();
            }
        });
    });

    setupPriceFilters();
    setupSearch();
    setupResetFilters();

    // Sort (se presente)
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() { sortProducts(this.value); });
    }
}

/* setupPriceFilters: supporta sia i bottoni/icone dentro sidebar che nell'offcanvas */
function setupPriceFilters() {
    // icone/bottoni che applicano il prezzo — include selettori presenti in mobile/offcanvas
    document.querySelectorAll('.bi-arrow-right-square, .bi-arrow, [data-price-apply]').forEach(btn => {
        if (btn._priceBound) return;
        btn._priceBound = true;

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const container = this.closest('.container-fluid, .row, .offcanvas-body, .sidenav');
            const minInput = container && (container.querySelector('input[name="price_min"]') || container.querySelector('input[placeholder*="minimo"]'));
            const maxInput = container && (container.querySelector('input[name="price_max"]') || container.querySelector('input[placeholder*="massimo"]'));
            if (minInput && maxInput) {
                filterByPrice(minInput.value.trim(), maxInput.value.trim());
            }
        });
    });

    // Enter sui campi prezzo
    document.querySelectorAll('input[name="price_min"], input[name="price_max"], input[placeholder*="minimo"], input[placeholder*="massimo"]').forEach(input => {
        if (input._enterBound) return;
        input._enterBound = true;

        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const container = this.closest('.container-fluid, .row, .offcanvas-body, .sidenav');
                const minInput = container && (container.querySelector('input[name="price_min"]') || container.querySelector('input[placeholder*="minimo"]'));
                const maxInput = container && (container.querySelector('input[name="price_max"]') || container.querySelector('input[placeholder*="massimo"]'));
                if (minInput && maxInput) filterByPrice(minInput.value.trim(), maxInput.value.trim());
            }
        });
    });
}

/* toggleShowAllButton: mostra quando ci sono filtri attivi */
function toggleShowAllButton() {
    const btn = document.getElementById('show-all-btn');
    if (!btn) return;
    const hasFilters = Object.keys(activeFilters).length > 0;
    btn.classList.toggle('d-none', !hasFilters);
}

/* resetAllFilters: resetta tutto e chiude offcanvas su mobile */
function resetAllFilters() {
    activeFilters = {};
    filteredProducts = [...allProducts];

    // reset campi prezzo
    document.querySelectorAll('input[name="price_min"], input[name="price_max"], input[placeholder*="minimo"], input[placeholder*="massimo"]').forEach(i => i.value = '');

    // reset ricerca
    const searchInput = document.querySelector('.form-search, input[type="search"]');
    if (searchInput) searchInput.value = '';

    updateActiveFilterDisplay();
    displayProducts();
    // updateProductCount viene chiamata dentro displayProducts
    toggleShowAllButton();

    // chiudi offcanvas mobile se aperto
    const offEl = document.getElementById('filterOffcanvas');
    if (offEl) {
        const instance = bootstrap.Offcanvas.getInstance(offEl) || new bootstrap.Offcanvas(offEl);
        instance.hide();
    }
}


