'use strict';
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

// Inizializzazione delle tabelle 
function initDatabase() {
    return new Promise((resolve, reject) => {
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

        // Esecuzione dello schema SQL
        db.exec(schema, (err) => {
            if (err) {
                console.error('Errore durante la creazione delle tabelle:', err);
                return reject(err);
            }
            console.log('Tabelle create o già esistenti.');

            // Popolamento dati di esempio
            populateData().then(resolve).catch(reject);
        });
    });
}

// Inserimento dati
async function populateData() {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            // Admin
            const adminEmail = 'admin@trainly.com';
            const adminPassword = 'Admin123!';
            try {
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                db.run(`INSERT OR IGNORE INTO users (email, password, nome, cognome, role) VALUES (?, ?, ?, ?, ?)`, 
                    [adminEmail, hashedPassword, 'Admin', 'Trainly', 'admin'], 
                    function(err) {
                        if (err) {
                            console.error('Errore inserimento admin:', err);
                        } else if (this.changes > 0) {
                            console.log('Utente admin creato.');
                        } else {
                            console.log('Utente admin già esistente.');
                        }
                    }
                );
            } catch (err) {
                return reject(err);
            }

            // Users
            db.get('SELECT COUNT(*) as count FROM users WHERE role="user"', async (err, row) => {
                if (!err && row.count === 0) {
                    const users = [
                        { email: 'albitres2004@gmail.com', password: 'Test123!', nome: 'Angie', cognome: 'Albitres' },
                        { email: 'lucia.bianchi@gmail.com', password: 'Test123!', nome: 'Lucia', cognome: 'Bianchi' }
                    ];
                    for (const user of users) {
                        const hash = await bcrypt.hash(user.password, 10);
                        db.run(`INSERT OR IGNORE INTO users (email, password, nome, cognome, role) VALUES (?, ?, ?, ?, 'user')`, [user.email, hash, user.nome, user.cognome]);
                    }
                    console.log('Utenti di test inseriti.');
                }
            });
            
            // Newsletter
            db.get('SELECT COUNT(*) as count FROM newsletter', (err, row) => {
                if (!err && row.count === 0) {
                    db.run(`INSERT INTO newsletter (email) VALUES ('newsletter@gmail.com')`);
                }
            });

            // Prodotti
            db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
                if (!err && row.count === 0) {
                    const products = [
                        { name: "Full Body Workout - 1 Giorno", description: "Scheda di allenamento full body...", category: "programma", price: 9.99, image_url: "/img/full_body.png" },
                        { name: "Beginner Workout - 2 Giorni", description: "Scheda di allenamento per principianti...", category: "programma", price: 14.99, image_url: "/img/beginner.png" },
                        { name: "Advanced Workout - 4 Giorni", description: "Scheda di allenamento avanzato...", category: "programma", price: 19.99, image_url: "/img/advanced.png" },
                        { name: "Coaching online - 1 mese", description: "Un mese di coaching online personalizzato...", category: "coaching", price: 39.99, image_url: "/img/coaching_1.png" },
                        { name: "Coaching online - 3 mesi", description: "Tre mesi di coaching online personalizzato...", category: "coaching", price: 104.99, image_url: "/img/coaching_3.png" },
                        { name: "Allenati meglio: i segreti per ottimizzare ogni sessione", description: "Scopri come massimizzare i tuoi allenamenti...", category: "ebook", price: 14.99, image_url: "/img/allenatiMeglio.png" },
                        { name: "50 Ricette proteiche facili e veloci per restare in forma", description: "Scopri come preparare piatti deliziosi...", category: "ebook", price: 14.99, image_url: "/img/ricette.png" },
                        { name: "Stretch & Recovery: la guida per migliorare flessibilità e prevenire infortuni", description: "Scopri come migliorare la tua flessibilità...", category: "ebook", price: 14.99, image_url: "/img/strech&Recovery.png" }
                    ];
                    const stmt = db.prepare(`INSERT INTO products (name, description, category, price, image_url) VALUES (?, ?, ?, ?, ?)`);
                    products.forEach(p => stmt.run(p.name, p.description, p.category, p.price, p.image_url));
                    stmt.finalize();
                    console.log('Prodotti di esempio inseriti.');
                }
                resolve(); // Risolvi la promessa dopo aver completato tutte le operazioni
            });
        });
    });
}

module.exports = { db, initDatabase };