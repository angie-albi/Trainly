'use strict';
const db = require('../db').db;

exports.createPayment = (paymentData) => {
    const { orderId, userId, total, method } = paymentData;
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO payments (order_id, user_id, amount, method, status, transaction_id)
            VALUES (?, ?, ?, ?, 'completato', ?)`;
        
        // Crea un ID di transazione fittizio
        const transactionId = 'FAKE-' + Date.now();

        db.run(sql, [orderId, userId, total, method, transactionId], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};