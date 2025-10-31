'use strict';
const db = require('../../db').db;

// Iscrizione di un'email alla newsletter
exports.subscribe = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO newsletter (email, subscribed_at) 
            VALUES (?, datetime('now'))`;
        db.run(sql, [email], function (err) {
            if (err) {
                // gestione dell'errore causato dall'email già registrata (primary key)
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return reject(new Error('Email già registrata alla newsletter'));
                }
                return reject(err);
            }
            resolve(this);
        });
    });
};