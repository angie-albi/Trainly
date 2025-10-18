'use strict';
const db = require('../../db').db;

// Funzioni per gestire i prodotti (Product DAO)
exports.getAllProducts = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id, name as title, description, category, price, image_url as image, available, created_at FROM products WHERE available = 1 ORDER BY created_at DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

exports.getProductById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id, name as title, description, category, price, image_url as image, available FROM products WHERE id = ? AND available = 1`;
        db.get(sql, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

exports.createProduct = (productData) => {
    const { name, description, category, price, image_url } = productData;
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO products (name, description, category, price, image_url, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`;
        db.run(sql, [name, description, category, price, image_url], function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

exports.updateProduct = (id, productData) => {
    const { name, description, category, price, image_url, available } = productData;
    return new Promise((resolve, reject) => {
        const sql = `UPDATE products SET name = ?, description = ?, category = ?, price = ?, image_url = ?, available = ? WHERE id = ?`;
        db.run(sql, [name, description, category, price, image_url, available, id], function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

exports.deleteProduct = (id) => {
    return new Promise((resolve, reject) => {
        // Soft delete
        const sql = `UPDATE products SET available = 0 WHERE id = ?`;
        db.run(sql, [id], function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};