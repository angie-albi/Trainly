document.addEventListener('DOMContentLoaded', async function() {
    // Legge il parametro 'order' dall'URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    // Se non c'è un ID nell'URL, non possiamo procedere
    if (!orderId) {
        alert('ID ordine non trovato!');
        window.location.href = '/catalogo'; // Torna al catalogo
        return;
    }

    try {
        // Chiama l'API del server per ottenere i dettagli dell'ordine
        const response = await fetch(`/api/order/${orderId}`);
        
        // Se la risposta non è "OK" (es. errore 404 o 403), gestisci l'errore
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ordine non trovato o non autorizzato.');
        }

        const result = await response.json();
        
        // Se l'API ha restituito i dati con successo, mostrali
        if (result.success) {
            displayOrderDetails(result.order);
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Errore nel caricamento dei dettagli dell\'ordine:', error);
        alert(error.message);
        window.location.href = '/profiloUtente'; // In caso di errore, manda l'utente al suo profilo
    }
});

/**
 * Funzione per popolare la pagina con i dati dell'ordine
 * @param {object} order - L'oggetto dell'ordine ricevuto dall'API
 */
function displayOrderDetails(order) {
    // Dettagli principali
    document.getElementById('orderNumber').textContent = order.id;
    document.getElementById('orderDate').textContent = new Date(order.created_at).toLocaleDateString('it-IT');
    document.getElementById('currentDateTime').textContent = new Date(order.created_at).toLocaleString('it-IT');
    document.getElementById('customerEmail').textContent = order.email;

    // Dati di fatturazione (semplificati con i dati utente)
    const billingInfo = document.getElementById('billingInfo');
    if (billingInfo) {
        billingInfo.innerHTML = `
            <p><strong>${order.nome} ${order.cognome}</strong></p>
            <p>${order.email}</p>
        `;
    }

    // Prodotti nell'ordine
    const orderItems = document.getElementById('orderItems');
    orderItems.innerHTML = ''; // Pulisce la tabella prima di popolarla
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
    
    // Calcolo e visualizzazione dei totali
    const subtotal = order.items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    const taxes = parseFloat(order.total) - subtotal;
    
    document.getElementById('orderSubtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('orderTaxes').textContent = `€${taxes.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `€${parseFloat(order.total).toFixed(2)}`;
}