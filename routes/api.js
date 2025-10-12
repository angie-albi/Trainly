const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { db } = require('../models/db');

// Funzioni di validazione helper
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePrice(price) {
    return typeof price === 'number' && price > 0 && isFinite(price);
}

function validateQuantity(quantity) {
    return Number.isInteger(quantity) && quantity > 0;
}

function validateUserPassword(password) {
    if (password.length < 8) {
        return { 
            isValid: false, 
            message: 'La password deve essere di almeno 8 caratteri' 
        };
    }
    
    if (!/[A-Z]/.test(password)) {
        return { 
            isValid: false, 
            message: 'La password deve contenere almeno una lettera maiuscola' 
        };
    }
    
    if (!/[a-z]/.test(password)) {
        return { 
            isValid: false, 
            message: 'La password deve contenere almeno una lettera minuscola' 
        };
    }
    
    if (!/[0-9]/.test(password)) {
        return { 
            isValid: false, 
            message: 'La password deve contenere almeno un numero' 
        };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { 
            isValid: false, 
            message: 'La password deve contenere almeno un carattere speciale' 
        };
    }
    
    return { isValid: true };
}

// Middleware per verificare se l'utente è autenticato
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ 
        success: false,
        message: 'Non autenticato' 
    });
}

// Middleware per verificare se l'utente è admin
function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ 
        success: false,
        message: 'Accesso negato - richiesti privilegi admin' 
    });
}

// =====================================
// ROUTE PUBBLICHE (senza autenticazione)
// =====================================

// GET /api/products - Ottieni tutti i prodotti
router.get('/products', async (req, res) => {
    try {
        console.log('Richiesta prodotti ricevuta');
        
        const products = await new Promise((resolve, reject) => {
            db.all(`SELECT 
                id,
                name as title,
                description, 
                category,
                price,
                image_url as image,
                available,
                created_at
            FROM products 
            WHERE available = 1 
            ORDER BY created_at DESC`, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        console.log(`Trovati ${products.length} prodotti`);
        
        const formattedProducts = products.map(product => ({
            id: product.id.toString(),
            title: product.title,
            description: product.description,
            category: product.category,
            price: parseFloat(product.price),
            image: product.image || '/images/placeholder.png'
        }));
        
        res.json({
            success: true,
            data: formattedProducts,
            count: formattedProducts.length
        });
        
    } catch (error) {
        console.error('Errore nel recupero prodotti:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server',
            error: error.message
        });
    }
});

// GET /api/products/:id - Ottieni un prodotto specifico
router.get('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        const product = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    id,
                    name as title,
                    description, 
                    category,
                    price,
                    image_url as image,
                    available
                FROM products 
                WHERE id = ? AND available = 1
            `, [productId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Prodotto non trovato'
            });
        }
        
        const formattedProduct = {
            id: product.id.toString(),
            title: product.title,
            description: product.description,
            category: product.category,
            price: parseFloat(product.price),
            image: product.image || '/images/placeholder.png'
        };
        
        res.json({
            success: true,
            data: formattedProduct
        });
        
    } catch (error) {
        console.error('Errore nel recupero prodotto:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/products/category/:category - Filtra per categoria
router.get('/products/category/:category', async (req, res) => {
    try {
        const category = req.params.category;
        
        const products = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    id,
                    name as title,
                    description, 
                    category,
                    price,
                    image_url as image
                FROM products 
                WHERE category = ? AND available = 1 
                ORDER BY created_at DESC
            `, [category], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        const formattedProducts = products.map(product => ({
            id: product.id.toString(),
            title: product.title,
            description: product.description,
            category: product.category,
            price: parseFloat(product.price),
            image: product.image || '/images/placeholder.png'
        }));
        
        res.json({
            success: true,
            data: formattedProducts,
            count: formattedProducts.length
        });
        
    } catch (error) {
        console.error('Errore filtro categoria:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel filtro categoria'
        });
    }
});

// GET /api/search - Ricerca prodotti
router.get('/search', async (req, res) => {
    try {
        const { query, category } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Query di ricerca troppo breve (minimo 2 caratteri)'
            });
        }
        
        let sql = `
            SELECT 
                id,
                name as title,
                description, 
                category,
                price,
                image_url as image
            FROM products 
            WHERE available = 1 
            AND (name LIKE ? OR description LIKE ?)
        `;
        let params = [`%${query}%`, `%${query}%`];
        
        if (category && category !== 'all') {
            sql += ` AND category = ?`;
            params.push(category);
        }
        
        sql += ` ORDER BY 
            CASE 
                WHEN name LIKE ? THEN 1 
                ELSE 2 
            END, created_at DESC`;
        params.push(`%${query}%`);
        
        const results = await new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        const formattedResults = results.map(product => ({
            id: product.id.toString(),
            title: product.title,
            description: product.description,
            category: product.category,
            price: parseFloat(product.price),
            image: product.image || '/images/placeholder.png'
        }));
        
        res.json({ 
            success: true, 
            query: query.trim(),
            category: category || 'all',
            data: formattedResults,
            count: formattedResults.length
        });
    } catch (error) {
        console.error('Errore ricerca:', error);
        res.status(500).json({ 
            success: false,
            message: 'Errore nella ricerca' 
        });
    }
});

// POST /api/newsletter - Iscrizione newsletter
router.post('/newsletter', async (req, res) => {
    try {
        const { email } = req.body;

        // Validazione email
        if (!email || !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email non valida'
            });
        }

        const emailNormalized = email.toLowerCase().trim();

        // Verifica se l'email esiste già
        const existing = await new Promise((resolve, reject) => {
            db.get(`
                SELECT email FROM newsletter WHERE email = ?
            `, [emailNormalized], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Email già registrata alla newsletter'
            });
        }

        // Inserisci email nel database
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO newsletter (email, subscribed_at)
                VALUES (?, datetime('now'))
            `, [emailNormalized], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        res.json({
            success: true,
            message: 'Iscrizione alla newsletter effettuata con successo!'
        });

    } catch (error) {
        console.error('Errore iscrizione newsletter:', error);
        
        res.status(500).json({
            success: false,
            message: 'Errore nell\'iscrizione alla newsletter'
        });
    }
});


// =====================================
// ROUTE UTENTI AUTENTICATI
// =====================================

// GET /api/user/profile - Profilo utente
router.get('/user/profile', isAuthenticated, (req, res) => {
    try {
        // Rimuovi la password dai dati dell'utente
        const { password, ...userWithoutPassword } = req.user;
        
        res.json({ 
            success: true,
            user: userWithoutPassword 
        });
    } catch (error) {
        console.error('Errore recupero profilo:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero del profilo'
        });
    }
});

// PUT /api/user/profile - Aggiorna profilo utente
router.put('/user/profile', isAuthenticated, async (req, res) => {
    try {
        const { nome, cognome, password } = req.body;
        const userId = req.user.id;

        // Validazione dati
        if (!nome || nome.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Il nome deve essere di almeno 2 caratteri'
            });
        }

        if (!cognome || cognome.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Il cognome deve essere di almeno 2 caratteri'
            });
        }

        // Validazione password se presente
        if (password) {
            const passwordValidation = validateUserPassword(password);
            if (!passwordValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: passwordValidation.message
                });
            }
        }

        // Prepara query di aggiornamento
        let sql = 'UPDATE users SET nome = ?, cognome = ?';
        let params = [nome.trim(), cognome.trim()];

        // Se c'è una nuova password, aggiungila all'aggiornamento
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql += ', password = ?';
            params.push(hashedPassword);
        }

        sql += ' WHERE id = ?';
        params.push(userId);

        await new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        // Recupera i dati aggiornati dell'utente
        const updatedUser = await new Promise((resolve, reject) => {
            db.get('SELECT id, email, nome, cognome, role FROM users WHERE id = ?', 
                [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        res.json({
            success: true,
            message: 'Profilo aggiornato con successo',
            user: updatedUser
        });

    } catch (error) {
        console.error('Errore aggiornamento profilo:', error);
        res.status(500).json({
            success: false,
            message: 'Errore interno del server'
        });
    }
});

// GET /api/user/orders - Ottieni ordini dell'utente
router.get('/user/orders', isAuthenticated, async (req, res) => {
    try {
        const orders = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    o.id,
                    o.total,
                    o.status,
                    o.created_at,
                    COUNT(oi.id) as items_count
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.user_id = ?
                GROUP BY o.id
                ORDER BY o.created_at DESC
                LIMIT 10
            `, [req.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        res.json({
            success: true,
            orders: orders
        });

    } catch (error) {
        console.error('Errore recupero ordini utente:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero degli ordini'
        });
    }
});

// GET /api/cart - Visualizza carrello
router.get('/cart', isAuthenticated, async (req, res) => {
    try {
        const cartItems = await new Promise((resolve, reject) => {
            db.all(`
                SELECT ci.*, p.name, p.price, p.image_url,
                       (ci.quantity * p.price) as subtotal
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = ?
            `, [req.user.id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
        
        res.json({ 
            success: true, 
            items: cartItems, 
            total: total.toFixed(2) 
        });
    } catch (error) {
        console.error('Errore carrello:', error);
        res.status(500).json({ 
            success: false,
            message: 'Errore nel recupero del carrello' 
        });
    }
});

// POST /api/cart - Aggiungi al carrello
router.post('/cart', isAuthenticated, async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: 'ID prodotto richiesto'
            });
        }

        if (!validateQuantity(quantity)) {
            return res.status(400).json({
                success: false,
                message: 'Quantità non valida (deve essere un numero intero positivo)'
            });
        }

        // Verifica che il prodotto esista
        const product = await new Promise((resolve, reject) => {
            db.get(`
                SELECT * FROM products WHERE id = ? AND available = 1
            `, [product_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Prodotto non trovato'
            });
        }

        // Aggiungi o aggiorna quantità
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO cart_items (user_id, product_id, quantity)
                VALUES (?, ?, ?)
                ON CONFLICT(user_id, product_id) DO UPDATE SET
                quantity = quantity + ?
            `, [req.user.id, product_id, quantity, quantity], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        res.json({
            success: true,
            message: 'Prodotto aggiunto al carrello'
        });

    } catch (error) {
        console.error('Errore aggiunta carrello:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiunta al carrello'
        });
    }
});

// PUT /api/cart/:id - Modifica quantità nel carrello
router.put('/cart/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!validateQuantity(quantity)) {
            return res.status(400).json({
                success: false,
                message: 'Quantità non valida (deve essere un numero intero positivo)'
            });
        }

        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE cart_items
                SET quantity = ?
                WHERE id = ? AND user_id = ?
            `, [quantity, id, req.user.id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        res.json({
            success: true,
            message: 'Carrello aggiornato'
        });

    } catch (error) {
        console.error('Errore aggiornamento carrello:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento'
        });
    }
});

// DELETE /api/cart/:id - Rimuovi dal carrello
router.delete('/cart/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        
        await new Promise((resolve, reject) => {
            db.run(`
                DELETE FROM cart_items 
                WHERE id = ? AND user_id = ?
            `, [id, req.user.id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        res.json({ 
            success: true, 
            message: 'Prodotto rimosso dal carrello' 
        });
    } catch (error) {
        console.error('Errore rimozione carrello:', error);
        res.status(500).json({ 
            success: false,
            message: 'Errore nella rimozione' 
        });
    }
});

// =====================================
// ROUTE ADMIN
// =====================================

// GET /api/admin/stats - Statistiche admin
router.get('/admin/stats', isAdmin, async (req, res) => {
    try {
        const stats = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    (SELECT COUNT(*) FROM users) as totalUsers,
                    (SELECT COUNT(*) FROM orders) as totalOrders,
                    (SELECT COUNT(*) FROM products WHERE available = 1) as totalProducts
            `, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Errore recupero statistiche:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nel recupero delle statistiche'
        });
    }
});

// POST /api/products - Crea prodotto (admin)
router.post('/products', isAdmin, async (req, res) => {
    try {
        const { name, description, category, price, image_url } = req.body;

        if (!name || !category || !price || !validatePrice(parseFloat(price))) {
            return res.status(400).json({
                success: false,
                message: 'Campi obbligatori mancanti o prezzo non valido (deve essere un numero positivo)'
            });
        }

        const result = await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO products (name, description, category, price, image_url, created_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            `, [name, description, category, price, image_url], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        res.json({
            success: true,
            message: 'Prodotto creato',
            product_id: result.lastID
        });

    } catch (error) {
        console.error('Errore creazione prodotto:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nella creazione del prodotto'
        });
    }
});

// POST /api/checkout - Conferma ordine e salva pagamento
router.post('/checkout', isAuthenticated, async (req, res) => {
    const { customer, billing, payment, notes } = req.body;
    const userId = req.user.id;

    try {
        // 1. Recupera carrello utente
        const cartItems = await new Promise((resolve, reject) => {
            db.all(`
                SELECT ci.*, p.name, p.price 
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.user_id = ?
            `, [userId], (err, rows) => err ? reject(err) : resolve(rows));
        });

        if (!cartItems.length) {
            return res.status(400).json({ success: false, message: 'Carrello vuoto' });
        }

        const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const taxes = subtotal * 0.22;
        const total = subtotal + taxes;

        // 2. Crea ordine
        const orderId = await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO orders (user_id, status, total) 
                VALUES (?, 'confermato', ?)
            `, [userId, total], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });

        // 3. Inserisci prodotti nell'ordine
        for (const item of cartItems) {
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                    VALUES (?, ?, ?, ?)
                `, [orderId, item.product_id, item.quantity, item.price], err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        // 4. Salva pagamento
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO payments (order_id, user_id, amount, method, status, transaction_id)
                VALUES (?, ?, ?, ?, 'completato', ?)
            `, [orderId, userId, total, payment.method, 'FAKE-' + Date.now()], err => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 5. Svuota carrello
        await new Promise((resolve, reject) => {
            db.run(`DELETE FROM cart_items WHERE user_id = ?`, [userId], err => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ success: true, orderId });

    } catch (error) {
        console.error('Errore checkout:', error);
        res.status(500).json({ success: false, message: 'Errore durante il checkout' });
    }
});

async function procediCheckout() {
    if (carrello.length === 0) {
        alert('Il carrello è vuoto! Aggiungi dei prodotti prima di procedere.');
        return;
    }
    
    // Se l'utente non è autenticato, reindirizza al login
    if (!isUserAuthenticated) {
        if (confirm('Devi essere loggato per procedere al checkout. Vuoi accedere ora?')) {
            window.location.href = '/accedi?redirect=/checkout';
        }
        return;
    }
    
    try {
        // Usa l'API per il checkout
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                // Includi qui i dati del cliente, pagamento, ecc.
                // secondo quanto richiesto dalla tua API
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Svuota il carrello locale
                carrello = [];
                salvaCarrello();
                aggiornaInterfacciaCarrello();
                
                // Reindirizza alla pagina di conferma
                window.location.href = '/confermaOrdine?orderId=' + data.orderId;
            } else {
                alert('Errore durante il checkout: ' + data.message);
            }
        } else {
            alert('Errore durante il checkout. Riprova più tardi.');
        }
    } catch (error) {
        console.error('Errore checkout:', error);
        alert('Errore durante il checkout. Riprova più tardi.');
    }
}


// PUT /api/products/:id - Modifica prodotto (admin)
router.put('/products/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, category, price, image_url, available } = req.body;

        if (price !== undefined && !validatePrice(parseFloat(price))) {
            return res.status(400).json({
                success: false,
                message: 'Prezzo non valido (deve essere un numero positivo)'
            });
        }

        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE products
                SET name = ?, description = ?, category = ?,
                price = ?, image_url = ?, available = ?
                WHERE id = ?
            `, [name, description, category, price, image_url, available, id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        res.json({
            success: true,
            message: 'Prodotto aggiornato'
        });

    } catch (error) {
        console.error('Errore aggiornamento prodotto:', error);
        res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento'
        });
    }
});

// DELETE /api/products/:id - Elimina prodotto (admin)
router.delete('/products/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        await new Promise((resolve, reject) => {
            db.run(`
                UPDATE products SET available = 0 WHERE id = ?
            `, [id], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        res.json({ 
            success: true, 
            message: 'Prodotto eliminato' 
        });
    } catch (error) {
        console.error('Errore eliminazione prodotto:', error);
        res.status(500).json({ 
            success: false,
            message: 'Errore nell\'eliminazione' 
        });
    }
});

module.exports = router;