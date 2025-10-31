// INIZILIZZAZIONE 
document.addEventListener('DOMContentLoaded', () => {
    const logoutLinks = document.querySelectorAll('a[href="/logout"]');
    logoutLinks.forEach(link => {
        link.href = '#';
        link.addEventListener('click', showLogoutModal);
    });
});

// --- FUNZIONI ---
// Funzione per mostrare il modal di conferma logout
function showLogoutModal() {
    if (!document.getElementById('logoutModal')) {
        const modalHtml = `
            <div class="modal fade" id="logoutModal" tabindex="-1" aria-labelledby="logoutModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header text-white">
                            <h5 class="modal-title" id="logoutModalLabel">Conferma Logout</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-black">
                            <p>Sei sicuro di voler uscire?</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Annulla</button>
                            <button type="button" class="btn btn-confirm-logout text-white" onclick="confirmLogout()">Conferma</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const modal = document.getElementById('logoutModal');
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Funzione per eseguire il logout effettivo
function confirmLogout() {
    const modal = document.getElementById('logoutModal');
    const bsModal = bootstrap.Modal.getInstance(modal);
    if (bsModal) bsModal.hide();
    window.location.href = '/logout';
}
