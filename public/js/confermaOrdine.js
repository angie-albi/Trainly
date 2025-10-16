document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');

    if (!orderId) {
        alert('ID ordine non trovato!');
        window.location.href = '/catalogo';
        return;
    }

    try {
        const response = await fetch(`/api/order/${orderId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ordine non trovato o non autorizzato.');
        }

        const result = await response.json();
        if (result.success) {
            displayOrderDetails(result.order);
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Errore nel caricamento dei dettagli dell\'ordine:', error);
        alert(error.message);
        window.location.href = '/profiloUtente'; // Reindirizza al profilo in caso di errore
    }
});

function displayOrderDetails(order) {
    // Dettagli principali
    document.getElementById('orderNumber').textContent = order.id;
    document.getElementById('orderDate').textContent = new Date(order.created_at).toLocaleDateString('it-IT');
    document.getElementById('currentDateTime').textContent = new Date(order.created_at).toLocaleString('it-IT');
    document.getElementById('customerEmail').textContent = order.email;

    // Dati di fatturazione
    const billingInfo = document.getElementById('billingInfo');
    if (billingInfo) {
        billingInfo.innerHTML = `
            <p><strong>${order.nome} ${order.cognome}</strong></p>
            <p>${order.email}</p>
        `;
    }

    // Prodotti
    const orderItems = document.getElementById('orderItems');
    order.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.title}</td>
            <td class="text-center">${item.quantity}</td>
            <td class.end">€${item.unit_price.toFixed(2)}</td>
            <td class="text-end">€${(item.unit_price * item.quantity).toFixed(2)}</td>
        `;
        orderItems.appendChild(row);
    });
    
    // Calcolo e visualizzazione totali
    const subtotal = order.items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    const taxes = order.total - subtotal;
    
    document.getElementById('orderSubtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('orderTaxes').textContent = `€${taxes.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `€${order.total.toFixed(2)}`;
}