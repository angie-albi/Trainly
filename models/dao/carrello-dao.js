'use strict';
const db = require('../../db').db;

// Recupero di tutti gli articoli di un utente nel carrello
exports.getCartItems = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT  c.id as cart_item_id, c.product_id, c.quantity, 
                    p.name, p.price, p.image_url, 
                    (c.quantity * p.price) as subtotal
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?`;
        db.all(sql, [userId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows || []);
            }
        });
    });
};

// Aggiunta degli articoli al carrello dell'utente
exports.addToCart = (userId, productId, quantity) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, product_id) DO 
                UPDATE SET
                    quantity = quantity + excluded.quantity`;
        db.run(sql, [userId, productId, quantity], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this);
            }
        });
    });
};

// Aggiornamento della quantità di un articolo nel carrello dell'utente
exports.updateCartItemByProductId = (productId, userId, quantity) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE cart_items SET quantity = ? 
            WHERE product_id = ? AND user_id = ?`;
        db.run(sql, [quantity, productId, userId], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this);
            }
        });
    });
};

// Rimozione di un articolo dal carrello dell'utente
exports.removeCartItemByProductId = (productId, userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            DELETE 
            FROM cart_items 
            WHERE product_id = ? AND user_id = ?`;
        db.run(sql, [productId, userId], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this);
            }
        });
    });
};

// Rimozione di tutti gli articoli dal carrello dell'utente
exports.clearCart = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            DELETE FROM cart_items 
            WHERE user_id = ?`;
        db.run(sql, [userId], function(err) {
            if (err) {
                reject(err);
            }
            else {
                resolve(this);
            }
        });
    });
};