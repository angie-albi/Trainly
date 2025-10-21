'use strict';
const db = require('../../db').db;

exports.getCartItems = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT ci.id as cart_item_id, ci.product_id, ci.quantity, 
                   p.name, p.price, p.image_url, 
                   (ci.quantity * p.price) as subtotal
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.user_id = ?`;
        db.all(sql, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

exports.addToCart = (userId, productId, quantity) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO cart_items (user_id, product_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, product_id) DO UPDATE SET
            quantity = quantity + excluded.quantity`;
        db.run(sql, [userId, productId, quantity], function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

exports.updateCartItemByProductId = (productId, userId, quantity) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE cart_items SET quantity = ? WHERE product_id = ? AND user_id = ?`;
        db.run(sql, [quantity, productId, userId], function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

exports.removeCartItemByProductId = (productId, userId) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM cart_items WHERE product_id = ? AND user_id = ?`;
        db.run(sql, [productId, userId], function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

exports.clearCart = (userId) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM cart_items WHERE user_id = ?`;
        db.run(sql, [userId], function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};