// --- INIZALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    if (!orderId) {
        document.querySelector('.container.my-5').innerHTML = `
            <div class="alert alert-danger text-center">
                <h4>ID Ordine Mancante</h4>
                <p>Impossibile caricare i dettagli dell'ordine perché l'identificativo non è stato trovato.</p>
                <a href="/profiloUtente" class="btn btn-primary">Torna al Profilo</a>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`/api/order/${orderId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Risposta non valida dal server.' }));
            throw new Error(errorData.message || 'Ordine non trovato o non sei autorizzato a vederlo.');
        }

        const result = await response.json();
        
        if (result.success && result.order) {
            displayOrderDetails(result.order);
        } else {
            throw new Error(result.message || 'Impossibile recuperare i dettagli dell\'ordine.');
        }

    } catch (error) {
        console.error('Errore nel caricamento dei dettagli dell\'ordine:', error);
        alert('Errore: ' + error.message);
        window.location.href = '/profiloUtente'; 
    }
});

// --- FUNZIONE PRINCIPALE ---
// Funzione per visualizzare i dettagli dell'ordine nella pagina
function displayOrderDetails(order) {
    document.getElementById('orderNumber').textContent = order.id;
    document.getElementById('orderDate').textContent = new Date(order.created_at).toLocaleDateString('it-IT');
    document.getElementById('currentDateTime').textContent = new Date(order.created_at).toLocaleString('it-IT');
    document.getElementById('customerEmail').textContent = order.email;

    const billingInfo = document.getElementById('billingInfo');
    if (billingInfo) {
        billingInfo.innerHTML = `
            <p class="mb-1"><strong>${order.nome} ${order.cognome}</strong></p>
            <p class="mb-0">${order.email}</p>
        `;
    }

    const orderItems = document.getElementById('orderItems');
    orderItems.innerHTML = ''; 
    order.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.title}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-end">€${parseFloat(item.unit_price).toFixed(2)}</td>
            <td class="text-end">€${(item.unit_price * item.quantity).toFixed(2)}</td>
        `;
        orderItems.appendChild(row);
    });
    
    const subtotal = order.items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    const taxes = parseFloat(order.total) - subtotal;
    
    document.getElementById('orderSubtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('orderTaxes').textContent = `€${taxes.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `€${parseFloat(order.total).toFixed(2)}`;
}