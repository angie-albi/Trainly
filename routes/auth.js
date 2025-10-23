'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const userDao = require('../models/dao/utenti-dao');
const { body, validationResult } = require('express-validator');
const { isAuthenticated, isAdmin } = require('../middleware/autorizzazioni');

// --- Pagine pubbliche ---
router.get('/', (req, res) => res.render('index', { title: 'Home', currentPage: 'home' }));
router.get('/catalogo', (req, res) => res.render('catalogo', { title: 'Catalogo', currentPage: 'catalogo' }));
router.get('/chiSiamo', (req, res) => res.render('chiSiamo', { title: 'Chi Siamo', currentPage: 'chiSiamo' }));
router.get('/contatti', (req, res) => res.render('contatti', { title: 'Contatti', currentPage: 'contatti' }));
router.get('/terminiCondizioni', (req, res) => res.render('terminiCondizioni', { title: 'Termini e Condizioni', currentPage: 'terminiCondizioni' }));

// --- Pagine di autenticazione ---
router.get('/accedi', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/profiloUtente');
    res.render('accedi', { title: 'Accedi', currentPage: 'accedi', formData: req.session.formData || null });
    delete req.session.formData;
});

router.get('/registrati', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/profiloUtente');
    res.render('registrati', { title: 'Registrati', currentPage: 'registrati', formData: req.session.formData || null });
    delete req.session.formData;
});

// --- Pagine protette da autenticazione ---
router.get('/profiloUtente', isAuthenticated, (req, res) => res.render('profiloUtente', { title: 'Il mio profilo', user: req.user, currentPage: 'profiloUtente' }));
router.get('/checkout', isAuthenticated, (req, res) => res.render('checkout', { title: 'Checkout', user: req.user, currentPage: 'checkout' }));
router.get('/confermaOrdine', isAuthenticated, (req, res) => {
    const orderId = req.query.orderId;
    if (!orderId) return res.redirect('/profiloUtente');
    res.render('confermaOrdine', { title: 'Conferma Ordine', user: req.user, orderId: orderId, currentPage: 'confermaOrdine' });
});

// --- Pagina protetta per admin ---
router.get('/admin', isAdmin, (req, res) => res.render('admin', { title: 'Pannello Admin', user: req.user, currentPage: 'admin' }));

// --- POST autenticazione ---
// POST Login
router.post('/accedi',
    [
        body('email', 'Il formato dell\'email non è valido').isEmail(),
        body('password', 'La password non può essere vuota').not().isEmpty()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array().map(e => e.msg).join('. ') });
        }

        passport.authenticate('local', (err, user, info) => {
            if (err) return next(err);

            if (!user) {
                return res.status(401).json({ success: false, message: 'Credenziali errate. Riprova.' });
            }

            req.logIn(user, (err) => {
                if (err) return next(err);
                
                const redirectUrl = user.role === 'admin' ? '/admin' : '/profiloUtente';
                return res.json({ success: true, redirect: redirectUrl });
            });
        })(req, res, next);
    }
);

// POST Registrazione
router.post('/register',
    [
        body('nome').trim().notEmpty().withMessage('Il nome è obbligatorio.'),
        body('cognome').trim().notEmpty().withMessage('Il cognome è obbligatorio.'),
        body('email').isEmail().withMessage('Il formato dell\'email non è valido.').normalizeEmail(),
        body('password').isLength({ min: 8 }).withMessage('La password deve essere di almeno 8 caratteri.'),
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
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        try {
            const { nome, cognome, email, password } = req.body;
            const userExists = await userDao.findByEmail(email);
            if (userExists) {
                return res.status(409).json({ success: false, message: 'Un utente con questa email è già registrato.' });
            }

            await userDao.createUser({ nome, cognome, email, password, role: 'user' });
            return res.status(201).json({ success: true, message: 'Registrazione completata!' });

        } catch (error) {
            console.error('Errore API registrazione:', error);
            return res.status(500).json({ success: false, message: 'Errore interno del server.' });
        }
    }
);

// --- Logout ---
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
            if (err) {
                console.error('Errore durante il logout:', err);
                return res.redirect('/');
            }
            res.clearCookie('connect.sid');
            res.redirect('/?logout=success');
        });
    });
});

module.exports = router;