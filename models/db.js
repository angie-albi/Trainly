const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '../db.sqlite');
const db = new sqlite3.Database(dbPath);

// Inizializzazione delle tabelle e popolamento dati di esempio
function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            // Creazione tabelle (come già presente)
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nome TEXT NOT NULL,
                cognome TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Errore creazione tabella users:', err);
                    return reject(err);
                }
                console.log('Tabella users creata con successo');
            });

            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                image_url TEXT,
                available INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error('Errore tabella products:', err);
                else console.log('Tabella products creata con successo');
            });


            // Tabella ordini
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                total DECIMAL(10,2) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`, (err) => {
                if (err) console.error('Errore tabella orders:', err);
                else console.log('Tabella orders creata con successo');
            });

            // Tabella elementi ordini
            db.run(`CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`, (err) => {
                if (err) console.error('Errore tabella order_items:', err);
                else console.log('Tabella order_items creata con successo');
            });

            // Tabella pagamenti
            db.run(`CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                method TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                transaction_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`, (err) => {
                if (err) console.error('Errore tabella payments:', err);
                else console.log('Tabella payments creata con successo');
            });

            db.run(`CREATE TABLE IF NOT EXISTS cart_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                UNIQUE(user_id, product_id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`, (err) => {
                if (err) console.error('Errore tabella cart_items:', err);
                else console.log('Tabella cart_items creata con successo');
            });

            // Inserisci utente admin di default se non esiste
            const adminEmail = 'admin@trainly.com';
            const adminPassword = 'Admin123!';
            bcrypt.hash(adminPassword, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Errore hashing password admin:', err);
                    return reject(err);
                }
                db.run(`INSERT OR IGNORE INTO users (email, password, nome, cognome, role) 
                        VALUES (?, ?, ?, ?, ?)`, 
                    [adminEmail, hashedPassword, 'Admin', 'Trainly', 'admin'], 
                    function(err) {
                        if (err) {
                            console.error('Errore inserimento admin:', err);
                            return reject(err);
                        }
                        if (this.changes > 0) {
                            console.log('Utente admin creato');
                        } else {
                            console.log('Utente admin già esistente');
                        }
                        // Dopo admin, popola prodotti e utenti di esempio
                        populateExampleData().then(resolve).catch(reject);
                    }
                );
            });

            // Funzione per popolare prodotti e utenti di esempio
            async function populateExampleData() {
                // Popola prodotti se vuoto
                db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
                    if (err) return reject(err);
                    if (row.count === 0) {
                        const products = [
                            {
                                name: "Full Body Workout - 1 Giorno",
                                description: "Scheda di allenamento full body in un'unica giornata, pensata per allenare tutti i gruppi muscolari in modo equilibrato ed efficace. Perfetta per chi vuole massimizzare i risultati con un programma semplice e mirato.",
                                category: "programma",
                                price: 9.99,
                                image_url: "/img/full_body.png"
                            },
                            {
                                name: "Beginner Workout - 2 Giorni",
                                description: "Scheda di allenamento per principianti con 2 sessioni settimanali: una dedicata alla parte superiore del corpo e una alla parte inferiore. Perfetta per chi vuole iniziare a costruire forza, tonificazione e una solida base di forma fisica.",
                                category: "programma",
                                price: 14.99,
                                image_url: "/img/beginner.png"
                            },
                            {
                                name: "Advanced Workout - 4 Giorni",
                                description: "Scheda di allenamento avanzato con 4 sessioni settimanali, mirata a chi ha già esperienza e cerca un programma sfidante per massimizzare i risultati.",
                                category: "programma",
                                price: 19.99,
                                image_url: "/img/advanced.png"
                            },
                            {
                                name: "Coaching online - 1 mese",
                                description: "Un mese di coaching online personalizzato, con sessioni settimanali per monitorare i progressi e adattare il programma alle esigenze individuali.",
                                category: "coaching",
                                price: 39.99,
                                image_url: "/img/coaching_1.png"
                            },
                            {
                                name: "Coaching online - 3 mesi",
                                description: "Tre mesi di coaching online personalizzato, con sessioni settimanali per monitorare i progressi e adattare il programma alle esigenze individuali.",
                                category: "coaching",
                                price: 104.99,
                                image_url: "/img/coaching_3.png"
                            },
                            {
                                name: "Allenati meglio: i segreti per ottimizzare ogni sessione",
                                description: "Scopri come massimizzare i tuoi allenamenti con strategie e tecniche avanzate, per ottenere risultati tangibili in meno tempo.",
                                category: "ebook",
                                price: 14.99,
                                image_url: "/img/allenatiMeglio.png"
                            },
                            {
                                name: "50 Ricette proteiche facili e veloci per restare in forma",
                                description: "Scopri come preparare piatti deliziosi e nutrienti per sostenere il tuo allenamento e raggiungere i tuoi obiettivi di fitness.",
                                category: "ebook",
                                price: 14.99,
                                image_url: "/img/ricette.png"
                            },
                            {
                                name: "Stretch & Recovery: la guida per migliorare flessibilità e prevenire infortuni",
                                description: "Scopri come migliorare la tua flessibilità e prevenire infortuni con esercizi e tecniche di recupero efficaci.",
                                category: "ebook",
                                price: 14.99,
                                image_url: "/img/strech&Recovery.png"
                            }
                        ];
                        products.forEach(product => {
                            db.run(
                                `INSERT INTO products (name, description, category, price, image_url, available, created_at)
                                 VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
                                [product.name, product.description, product.category, product.price, product.image_url]
                            );
                        });
                        console.log('Prodotti di esempio inseriti');
                    }
                });

                // Popola utenti di test se non esistono
                db.get('SELECT COUNT(*) as count FROM users WHERE role="user"', (err2, row2) => {
                    if (err2) return reject(err2);
                    if (row2.count === 0) {
                        const users = [
                            { email: 'albitres2004@gmail.com', password: 'Test123!', nome: 'Angie', cognome: 'Albitres' },
                            { email: 'lucia.bianchi@gmail.com', password: 'Test123!', nome: 'Lucia', cognome: 'Bianchi' }
                        ];
                        users.forEach(user => {
                            bcrypt.hash(user.password, 10, (err, hash) => {
                                if (!err) {
                                    db.run(
                                        `INSERT OR IGNORE INTO users (email, password, nome, cognome, role, created_at)
                                         VALUES (?, ?, ?, ?, 'user', CURRENT_TIMESTAMP)`,
                                        [user.email, hash, user.nome, user.cognome]
                                    );
                                }
                            });
                        });
                        console.log('Utenti di test inseriti');
                    }
                    resolve();
                });
            }
        });
    });
}

// Funzioni per gestire gli utenti
class UserModel {
    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    static async create(userData) {
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
    }


    static verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    
}

module.exports = { db, initDatabase, UserModel };