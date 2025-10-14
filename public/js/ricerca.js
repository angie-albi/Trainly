// Gestione ricerca
let searchManager = {
    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        // Gestione form di ricerca nell'offcanvas
        const searchForms = document.querySelectorAll('form[role="search"]');
        searchForms.forEach(form => {
            form.addEventListener('submit', this.handleSearch.bind(this));
        });

        // Gestione input di ricerca con enter
        const searchInputs = document.querySelectorAll('input[type="search"]');
        searchInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(input.value);
                }
            });
        });

        // Gestione click diretto sui bottoni di submit
        const searchButtons = document.querySelectorAll('form[role="search"] button[type="submit"]');
        searchButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const form = button.closest('form');
                const searchInput = form.querySelector('input[type="search"]');
                if (searchInput) {
                    this.performSearch(searchInput.value);
                }
            });
        });

        // Gestione bottoni di ricerca che aprono l'offcanvas
        const searchToggleButtons = document.querySelectorAll('.btn-cerca:not(form button)');
        searchToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Apri l'offcanvas di ricerca (gestito da Bootstrap)
            });
        });
    },

    handleSearch: function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const searchInput = e.target.querySelector('input[type="search"]');
        if (searchInput) {
            this.performSearch(searchInput.value);
        }
    },

    performSearch: function(query) {
        if (!query.trim()) return;
        
        // Chiudi l'offcanvas di ricerca
        const searchOffcanvas = document.getElementById('offcanvasTop');
        if (searchOffcanvas) {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(searchOffcanvas);
            if (bsOffcanvas) {
                bsOffcanvas.hide();
            }
        }

        // Reindirizza alla pagina del catalogo con la query di ricerca
        const searchUrl = `/catalogo?search=${encodeURIComponent(query)}`;
        window.location.href = searchUrl;
    }
};

// Inizializzazione quando il DOM è pronto
document.addEventListener('DOMContentLoaded', function() {
    searchManager.init();
    
    // Se siamo nella pagina catalogo, gestisci i parametri URL
    if (window.location.pathname.includes('/catalogo')) {
        handleCatalogSearch();
    }
});

// Gestione ricerca nella pagina catalogo
function handleCatalogSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    
    if (searchTerm) {
        // Se c'è un termine di ricerca nell'URL, applicalo
        const searchMessage = document.getElementById('search-message');
        if (searchMessage) {
            searchMessage.textContent = `Risultati per: "${decodeURIComponent(searchTerm)}"`;
        }
        
        // Se la funzione applyFilters esiste (da catalogo.js), applicala
        if (typeof applyFilters === 'function') {
            setSearchTerm(decodeURIComponent(searchTerm));
            applyFilters();
        }
        
        // Popola l'input di ricerca se esiste
        const searchInputs = document.querySelectorAll('input[type="search"]');
        searchInputs.forEach(input => {
            input.value = decodeURIComponent(searchTerm);
        });
    }
}