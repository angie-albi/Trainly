'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const { isAuthenticated, isAdmin } = require('../middleware/autorizzazioni');

// --- PAGINE PUBBLICHE ---
router.get('/', (req, res) => res.render('index', { title: 'Home', currentPage: 'home' }));
router.get('/catalogo', (req, res) => res.render('catalogo', { title: 'Catalogo', currentPage: 'catalogo' }));
router.get('/chiSiamo', (req, res) => res.render('chiSiamo', { title: 'Chi Siamo', currentPage: 'chiSiamo' }));
router.get('/contatti', (req, res) => res.render('contatti', { title: 'Contatti', currentPage: 'contatti' }));
router.get('/terminiCondizioni', (req, res) => res.render('terminiCondizioni', { title: 'Termini e Condizioni', currentPage: 'terminiCondizioni' }));

// --- PAGINE DI AUTENTICAZIONE ---
router.get('/accedi', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/profiloUtente');
    res.render('accedi', { title: 'Accedi', currentPage: 'accedi' });
});

router.get('/registrati', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/profiloUtente');
    res.render('registrati', { title: 'Registrati', currentPage: 'registrati' });
});

// --- PAGINE PROTETTE ---
router.get('/profiloUtente', isAuthenticated, (req, res) => res.render('profiloUtente', { title: 'Il mio profilo', user: req.user, currentPage: 'profiloUtente' }));
router.get('/checkout', isAuthenticated, (req, res) => res.render('checkout', { title: 'Checkout', user: req.user, currentPage: 'checkout' }));
router.get('/confermaOrdine', isAuthenticated, (req, res) => {
    const orderId = req.query.orderId;
    if (!orderId) return res.redirect('/profiloUtente');
    res.render('confermaOrdine', { title: 'Conferma Ordine', user: req.user, orderId: orderId, currentPage: 'confermaOrdine' });
});
router.get('/admin', isAdmin, (req, res) => res.render('admin', { title: 'Pannello Admin', user: req.user, currentPage: 'admin' }));

// Login 
router.post('/accedi',
    [
        body('email', 'Il formato dell\'email non è valido').isEmail(),
        body('password', 'La password non può essere vuota').not().isEmpty()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array({ onlyFirstError: true })[0].msg });
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

// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.redirect('/?logout=success');
        });
    });
});

module.exports = router;