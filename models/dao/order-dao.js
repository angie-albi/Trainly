'use strict';
const db = require('../db').db;

// Funzioni per gestire gli ordini (Order DAO)
exports.getOrderById = (orderId, userId, isAdmin) => {
    let sql = `SELECT o.id, o.total, o.status, o.created_at, u.email, u.nome, u.cognome FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`;
    let params = [orderId];

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

exports.getOrderItems = (orderId) => {
    const sql = `SELECT oi.quantity, oi.unit_price, p.name as title FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?`;
    return new Promise((resolve, reject) => {
        db.all(sql, [orderId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

exports.getUserOrders = (userId) => {
    const sql = `SELECT o.id, o.total, o.status, o.created_at, COUNT(oi.id) as items_count FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC LIMIT 10`;
    return new Promise((resolve, reject) => {
        db.all(sql, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

exports.getAllOrders = () => {
    const sql = `SELECT o.id, o.total, o.status, o.created_at, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`;
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};