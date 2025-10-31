'use strict';
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

// --- DAO IMPORTS ---
const contactDao = require('../models/dao/contatti-dao');
const productDao = require('../models/dao/prodotti-dao');
const orderDao = require('../models/dao/ordini-dao');
const userDao = require('../models/dao/utenti-dao');
const cartDao = require('../models/dao/carrello-dao');
const newsletterDao = require('../models/dao/newsletter-dao');
const paymentDao = require('../models/dao/pagamenti-dao');

/// --- FUNZIONI ---
// Funzioni di validazione
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Middleware di autorizzazione
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Non autenticato' });
}

function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ success: false, message: 'Accesso negato - privilegi di amministratore richiesti' });
}

// --- PRODOTTI ---
router.get('/products', async (req, res) => {
    try {
        const products = await productDao.getAllProducts();
        const formattedProducts = products.map(product => ({
            ...product,
            id: String(product.id),
            price: parseFloat(product.price)
        }));
        res.json({ success: true, data: formattedProducts, count: formattedProducts.length });
    } catch (error) {
        console.error('Errore nel recupero dei prodotti:', error);
        res.status(500).json({ success: false, message: 'Errore interno del server' });
    }
});

router.get('/products/:id', async (req, res) => {
    try {
        const product = await productDao.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Prodotto non trovato' });
        }
        res.json({ success: true, data: product });
    } catch (error) {
        console.error(`Errore nel recupero del prodotto ${req.params.id}:`, error);
        res.status(500).json({ success: false, message: 'Errore interno del server' });
    }
});

// --- NEWSLETTER ---
router.post('/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Il formato dell\'email non è valido' });
        }
        await newsletterDao.subscribe(email.toLowerCase().trim());
        res.json({ success: true, message: 'Iscrizione alla newsletter effettuata con successo!' });
    } catch (error) {
        if (error.message.includes('Email già registrata')) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('Errore iscrizione newsletter:', error);
        res.status(500).json({ success: false, message: 'Errore durante l\'iscrizione' });
    }
});

// --- PROFILO UTENTE ---
router.get('/user/profile', isAuthenticated, (req, res) => {
    const { password, ...user } = req.user;
    res.json({ success: true, user });
});

router.put('/user/profile', isAuthenticated, async (req, res) => {
    try {
        const { nome, cognome, password, currentPassword } = req.body;
        let userData = { nome, cognome };

        // Se l'utente sta cercando di cambiare la password
        if (password && password.trim() !== '') {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'La password attuale è richiesta per impostarne una nuova.' });
            }

            const user = await userDao.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Utente non trovato.' });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(403).json({ success: false, message: 'La password attuale non è corretta. Riprova.' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            userData.password = hashedPassword;
        }

        await userDao.updateUser(req.user.id, userData);
        const updatedUser = await userDao.findById(req.user.id);
        const { password: _, ...userResponse } = updatedUser;
        
        // Invia la risposta con l'utente aggiornato
        res.json({ success: true, message: 'Profilo aggiornato con successo', user: userResponse });

    } catch (error) {
        console.error('Errore aggiornamento profilo:', error);
        res.status(500).json({ success: false, message: 'Errore interno del server durante l\'aggiornamento del profilo.' });
    }
});

// --- CARRELLO ---
router.get('/cart', isAuthenticated, async (req, res) => {
    try {
        const items = await cartDao.getCartItems(req.user.id);
        const total = parseFloat(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
        res.json({ success: true, items, total });
    } catch (error) {
        console.error('Errore recupero carrello:', error);
        res.status(500).json({ success: false, message: 'Errore nel recupero del carrello' });
    }
});

router.post('/cart', isAuthenticated, async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        if (!product_id || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Dati prodotto non validi.' });
        }
        await cartDao.addToCart(req.user.id, product_id, quantity);
        res.json({ success: true, message: 'Prodotto aggiunto al carrello' });
    } catch (error) {
        console.error('Errore aggiunta carrello:', error);
        res.status(500).json({ success: false, message: 'Errore nell\'aggiunta al carrello' });
    }
});

// Rotta per aggiornare la quantità di un prodotto nel carrello usando productId
router.put('/cart/product/:productId', isAuthenticated, async (req, res) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;

        if (quantity <= 0) {
             await cartDao.removeCartItemByProductId(productId, req.user.id);
             res.json({ success: true, message: 'Prodotto rimosso dal carrello' });
        } else {
            await cartDao.updateCartItemByProductId(productId, req.user.id, quantity);
            res.json({ success: true, message: 'Carrello aggiornato' });
        }
    } catch (error) {
        console.error('Errore aggiornamento carrello:', error);
        res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento' });
    }
});

// Rotta per rimuovere un prodotto dal carrello usando productId
router.delete('/cart/product/:productId', isAuthenticated, async (req, res) => {
    try {
        await cartDao.removeCartItemByProductId(req.params.productId, req.user.id);
        res.json({ success: true, message: 'Prodotto rimosso dal carrello' });
    } catch (error) {
        console.error('Errore rimozione carrello:', error);
        res.status(500).json({ success: false, message: 'Errore nella rimozione' });
    }
});

// Rotta per svuotare il carrello
router.delete('/cart/all', isAuthenticated, async (req, res) => {
    try {
        await cartDao.clearCart(req.user.id);
        res.json({ success: true, message: 'Carrello svuotato con successo' });
    } catch (error) {
        console.error('Errore svuotamento carrello:', error);
        res.status(500).json({ success: false, message: 'Errore nello svuotamento del carrello' });
    }
});

router.post('/register',
    [
        body('nome').trim().notEmpty().withMessage('Il nome è obbligatorio.'),
        body('cognome').trim().notEmpty().withMessage('Il cognome è obbligatorio.'),
        body('email').isEmail().withMessage("Il formato dell'email non è valido").normalizeEmail(),
        body('password')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
            .withMessage('La password non rispetta i requisiti di sicurezza.'),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Le password non corrispondono.');
            }
            return true;
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstError = errors.array({ onlyFirstError: true })[0];

            if (firstError.path === 'password') {
                return res.status(400).json({
                    success: false,
                    message: firstError.msg,
                    errorType: 'WEAK_PASSWORD' 
                });
            }

            // Per tutti gli altri errori, inviamo un messaggio standard.
            return res.status(400).json({ success: false, message: firstError.msg });
        }

        try {
            const { nome, cognome, email, password } = req.body;
            const userExists = await userDao.findByEmail(email);
            if (userExists) {
                return res.status(409).json({ success: false, message: 'Un utente con questa email è già registrato.' });
            }
            await userDao.createUser({ nome, cognome, email, password });
            return res.status(201).json({ success: true, message: 'Registrazione completata!' });
        } catch (error) {
            console.error('Errore API registrazione:', error);
            return res.status(500).json({ success: false, message: 'Errore interno del server.' });
        }
    }
);


// --- ORDINI ---
router.get('/user/orders', isAuthenticated, async (req, res) => {
    try {
        const orders = await orderDao.getUserOrders(req.user.id);
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Errore recupero ordini utente:', error);
        res.status(500).json({ success: false, message: 'Errore nel recupero degli ordini' });
    }
});

router.get('/order/:id', isAuthenticated, async (req, res) => {
    try {
        const isAdminUser = req.user.role === 'admin';
        const order = await orderDao.getOrderById(req.params.id, req.user.id, isAdminUser);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Ordine non trovato o accesso non autorizzato.' });
        }
        const items = await orderDao.getOrderItems(req.params.id);
        res.json({ success: true, order: { ...order, items } });
    } catch (error) {
        console.error('Errore nel recupero dei dettagli dell\'ordine:', error);
        res.status(500).json({ success: false, message: 'Errore interno del server' });
    }
});

// --- CHECKOUT ---
router.post('/checkout', isAuthenticated, async (req, res) => {
    const userId = req.user.id;
    const { customer, order, payment } = req.body;

    try {
        const cartItems = await cartDao.getCartItems(userId);
        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Il carrello è vuoto.' });
        }

        const subtotal = parseFloat(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2));
        const taxes = parseFloat((subtotal * 0.22).toFixed(2));
        const total = parseFloat((subtotal + taxes).toFixed(2));

        const orderDetails = {
            firstName: customer.firstName,
            lastName: customer.lastName,
            address: order.address,
            city: order.city,
            postalCode: order.postalCode,
            country: order.country,
            email: customer.email,
            phone: customer.phone
        };

        const orderId = await orderDao.createOrder(userId, total, orderDetails);
        await orderDao.addOrderItems(orderId, cartItems);

        await paymentDao.createPayment({
            orderId,
            userId,
            total,
            method: payment.method
        });

        await cartDao.clearCart(userId);

        res.json({ success: true, orderId });

    } catch (error) {
        console.error('Errore durante il checkout:', error);
        res.status(500).json({ success: false, message: 'Errore durante il checkout' });
    }
});

// --- CONTATTI ---
router.post('/contacts', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validazione
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Tutti i campi sono obbligatori.' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Il formato dell\'email non è valido' });
        }

        await contactDao.createContactMessage({ name, email, message });
        res.json({ success: true, message: 'Messaggio inviato con successo!' });

    } catch (error) {
        console.error('Errore durante il salvataggio del messaggio di contatto:', error);
        res.status(500).json({ success: false, message: 'Errore interno del server.' });
    }
});



// --- ADMIN ---
router.post('/products', isAdmin, async (req, res) => {
    try {
        const productId = await productDao.createProduct(req.body);
        res.json({ success: true, message: 'Prodotto creato con successo', product_id: productId });
    } catch (error) {
        console.error('Errore creazione prodotto (admin):', error);
        res.status(500).json({ success: false, message: 'Errore nella creazione del prodotto' });
    }
});

router.put('/products/:id', isAdmin, async (req, res) => {
    try {
        await productDao.updateProduct(req.params.id, req.body);
        res.json({ success: true, message: 'Prodotto aggiornato con successo' });
    } catch (error) {
        console.error('Errore aggiornamento prodotto (admin):', error);
        res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del prodotto' });
    }
});

router.delete('/products/:id', isAdmin, async (req, res) => {
    try {
        await productDao.deleteProduct(req.params.id);
        res.json({ success: true, message: 'Prodotto eliminato con successo' });
    } catch (error) {
        console.error('Errore eliminazione prodotto (admin):', error);
        res.status(500).json({ success: false, message: 'Errore nell\'eliminazione del prodotto' });
    }
});

router.get('/admin/orders', isAdmin, async (req, res) => {
    try {
        const orders = await orderDao.getAllOrders();
        res.json({ success: true, orders });
    } catch (error) {
        console.error('Errore recupero ordini (admin):', error);
        res.status(500).json({ success: false, message: 'Errore nel recupero degli ordini.' });
    }
});

module.exports = router;