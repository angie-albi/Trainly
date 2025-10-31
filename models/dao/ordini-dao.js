'use strict';
const db = require('../../db').db;

// Creazione di un nuovo ordine
exports.createOrder = (userId, total, orderDetails) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO orders (
                user_id, status, total,
                order_name, order_surname, order_address,
                order_city, order_postal_code, order_country,
                email, phone
            )
            VALUES (?, 'confermato', ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            userId, total,
            orderDetails.firstName, 
            orderDetails.lastName,
            orderDetails.address, 
            orderDetails.city,
            orderDetails.postalCode, 
            orderDetails.country,
            orderDetails.email, 
            orderDetails.phone
        ];

        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
};

// Aggiunta degli articoli dal carrello all'ordine
exports.addOrderItems = (orderId, cartItems) => {
    const promises = cartItems.map(item => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, product_name) 
                VALUES (?, ?, ?, ?, ?)`;
            db.run(sql, [orderId, item.product_id, item.quantity, item.price, item.name], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
    return Promise.all(promises);
};

// Recupero dei dettagli di un ordine tramite ID
exports.getOrderById = (orderId, userId, isAdmin) => {
    let sql = `
        SELECT o.id, o.total, o.status, o.created_at, u.email, u.nome, u.cognome 
        FROM orders o 
            JOIN users u ON o.user_id = u.id 
        WHERE o.id = ?`;
    let params = [orderId];

    // se l'utente non è admin, può vedere solo i propri ordini
    if (!isAdmin) {
        sql += ' AND o.user_id = ?';
        params.push(userId);
    }

    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Recupero degli articoli di un ordine
exports.getOrderItems = (orderId) => {
    const sql = `
        SELECT quantity, unit_price, product_name as title 
        FROM order_items 
        WHERE order_id = ?`;
    return new Promise((resolve, reject) => {
        db.all(sql, [orderId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Recupero di tutti gli ordini di un utente (ultimi 10)
exports.getUserOrders = (userId) => {
    const sql = `
        SELECT o.id, o.total, o.status, o.created_at, COUNT(oi.id) as items_count 
        FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id 
        WHERE o.user_id = ? 
        GROUP BY o.id 
        ORDER BY o.created_at DESC 
        LIMIT 10`;
    return new Promise((resolve, reject) => {
        db.all(sql, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

// Recupero di tutti gli ordini nel db (admin)
exports.getAllOrders = () => {
    const sql = `
        SELECT o.id, o.total, o.status, o.created_at, u.email as user_email 
        FROM orders o 
            JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC`;
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};