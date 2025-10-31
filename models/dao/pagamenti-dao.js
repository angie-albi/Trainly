'use strict';
const db = require('../../db').db;

// Creazione di un nuovo pagamento
exports.createPayment = (paymentData) => {
    const { orderId, userId, total, method } = paymentData;
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO payments (order_id, user_id, amount, method, status, transaction_id)
            VALUES (?, ?, ?, ?, 'completato', ?)`;
        
        // crea un ID di transazione fittizio
        const transactionId = 'FAKE-' + Date.now();

        const formattedTotal = parseFloat(total).toFixed(2);
        db.run(sql, [orderId, userId, formattedTotal, method, transactionId], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};