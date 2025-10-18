'use strict';
const db = require('../../db').db;

exports.subscribe = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO newsletter (email, subscribed_at) VALUES (?, datetime('now'))`;
        db.run(sql, [email], function (err) {
            if (err) {
                // Gestisce il caso in cui l'email sia già presente (violazione UNIQUE)
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return reject(new Error('Email già registrata alla newsletter'));
                }
                return reject(err);
            }
            resolve(this);
        });
    });
};