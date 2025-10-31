'use strict';
const db = require('../../db').db;
const bcrypt = require('bcrypt');

// Recupero di un utente tramite email
exports.findByEmail = (email) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Recupero di un utente tramite ID
exports.findById = (id) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Creazione di un nuovo utente
exports.createUser = async (userData) => {
    const { email, password, nome, cognome, role = 'user' } = userData;
    const existing = await this.findByEmail(email);
    if (existing) {
        throw new Error('Email già registrata');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
        db.run(
        `INSERT INTO users (email, password, nome, cognome, role) VALUES (?, ?, ?, ?, ?)`,
        [email, hashedPassword, nome, cognome, role],
        function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, email, nome, cognome, role });
        }
        );
    });
};

//Aggiornamento dei dati dell'utente
exports.updateUser = (userId, userData) => {
    const { nome, cognome, password } = userData;
    let sql = 'UPDATE users SET nome = ?, cognome = ?';
    let params = [nome, cognome];

    if (password) {
        sql += ', password = ?';
        params.push(password);
    }
    sql += ' WHERE id = ?';
    params.push(userId);

    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};