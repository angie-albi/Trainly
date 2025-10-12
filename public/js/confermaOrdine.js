document.addEventListener('DOMContentLoaded', function() {
    // Numero Ordine
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('order');
    
    if (!orderNumber) {
        alert('Ordine non trovato!');
        window.location.href = 'catalogo.html';
        return;
    }

    // Recupera i dati 
    const orders = JSON.parse(localStorage.getItem('trainlyOrders') || '[]');
    const order = orders.find(o => o.orderNumber === orderNumber);

    if (!order) {
        alert('Ordine non trovato!');
        window.location.href = 'catalogo.html';
        return;
    }

    // Controllo permessi
    const userEmail = localStorage.getItem('userEmail');
    if (order.userEmail && order.userEmail !== userEmail) {
        alert('Non hai i permessi per visualizzare questo ordine.');
        window.location.href = 'catalogo.html';
        return;
    }

    document.getElementById('orderNumber').textContent = order.orderNumber;
    document.getElementById('orderDate').textContent = new Date(order.date).toLocaleDateString('it-IT');
    document.getElementById('currentDateTime').textContent = new Date(order.date).toLocaleString('it-IT');
    document.getElementById('customerEmail').textContent = order.customer.email;

    // Dati di fatturazione
    const billingInfo = document.getElementById('billingInfo');
    billingInfo.innerHTML = `
        <p><strong>${order.customer.firstName} ${order.customer.lastName}</strong></p>
        <p>${order.billing.address}</p>
        <p>${order.billing.postalCode} ${order.billing.city}</p>
        <p>${order.billing.country}</p>
        ${order.customer.phone ? `<p>Tel: ${order.customer.phone}</p>` : ''}
    `;

    // Prodotti ordinati
    const orderItems = document.getElementById('orderItems');
    order.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.title}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-end">€${item.price.toFixed(2)}</td>
            <td class="text-end">€${(item.price * item.quantity).toFixed(2)}</td>
        `;
        orderItems.appendChild(row);
    });

    // Totali
    document.getElementById('orderSubtotal').textContent = `€${order.totals.subtotal.toFixed(2)}`;
    document.getElementById('orderTaxes').textContent = `€${order.totals.taxes.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `€${order.totals.total.toFixed(2)}`;
});
