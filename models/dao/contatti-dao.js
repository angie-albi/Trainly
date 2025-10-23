'use strict';
const db = require('../../db').db;

exports.createContactMessage = (contactData) => {
    const { name, email, message } = contactData;
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)`;
        db.run(sql, [name, email, message], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
};