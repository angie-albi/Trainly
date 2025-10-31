// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', function() {
    searchManager.init();
    
    if (window.location.pathname.includes('/catalogo')) {
        handleCatalogSearch();
    }
});

// --- FUNZIONE PRINCIPALE ---
let searchManager = {
    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        // Gestione invio form di ricerca
        const searchForms = document.querySelectorAll('form[role="search"]');
        searchForms.forEach(form => {
            form.addEventListener('submit', this.handleSearch.bind(this));
        });

        const searchInputs = document.querySelectorAll('input[type="search"]');
        searchInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(input.value);
                }
            });
        });

        // Gestione bottoni di invio ricerca
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

        // Gestione bottoni di apertura offcanvas di ricerca
        const searchToggleButtons = document.querySelectorAll('.btn-cerca:not(form button)');
        searchToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Apri l'offcanvas di ricerca (gestito da Bootstrap)
            });
        });
    },

    // Gestione invio form di ricerca
    handleSearch: function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const searchInput = e.target.querySelector('input[type="search"]');
        if (searchInput) {
            this.performSearch(searchInput.value);
        }
    },

    // Esegui la ricerca e reindirizza alla pagina del catalogo
    performSearch: function(query) {
        if (!query.trim()) return;
        
        const searchOffcanvas = document.getElementById('offcanvasTop');
        if (searchOffcanvas) {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(searchOffcanvas);
            if (bsOffcanvas) {
                bsOffcanvas.hide();
            }
        }

        const searchUrl = `/catalogo?search=${encodeURIComponent(query)}`;
        window.location.href = searchUrl;
    }
};

// Gestione ricerca nella pagina catalogo
function handleCatalogSearch() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    
    if (searchTerm) {
        const searchMessage = document.getElementById('search-message');
        if (searchMessage) {
            searchMessage.textContent = `Cerca: "${decodeURIComponent(searchTerm)}"`;
        }
        
        if (typeof applyFilters === 'function') {
            setSearchTerm(decodeURIComponent(searchTerm));
            applyFilters();
        }
        
        const searchInputs = document.querySelectorAll('input[type="search"]');
        searchInputs.forEach(input => {
            input.value = decodeURIComponent(searchTerm);
        });
    }
}