'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const userDao = require('../models/dao/utenti-dao');
const { isAuthenticated, isAdmin } = require('../middleware/autorizzazioni');

// HOME
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Home',
        user: req.user || null,
        currentPage: 'index'
    });
});

// CATALOGO
router.get('/catalogo', (req, res) => {
    res.render('catalogo', {
        title: 'Catalogo',
        user: req.user || null,
        currentPage: 'catalogo'
    });
});

// CHECKOUT
router.get('/checkout', isAuthenticated, (req, res) => {
    res.render('checkout', {
        title: 'Checkout',
        user: req.user || null,
        currentPage: 'checkout',
        extraJS: ['/js/checkout.js']
    });
});


// CONFERMA ORDINE
router.get('/confermaOrdine', isAuthenticated, (req, res) => {
    const orderId = req.query.orderId; 
    if (!orderId) {
        return res.redirect('/profiloUtente');
    }
    res.render('confermaOrdine', {
        title: 'Conferma Ordine',
        user: req.user,
        currentPage: 'confermaOrdine',
        orderId: orderId, 
        extraJS: ['/js/confermaOrdine.js']
    });
});

// CHI SIAMO
router.get('/chiSiamo', (req, res) => {
    res.render('chiSiamo', {
        title: 'Chi Siamo',
        user: req.user || null,
        currentPage: 'chiSiamo'
    });
});

// CONTATTI
router.get('/contatti', (req, res) => {
    res.render('contatti', {
        title: 'Contatti',
        user: req.user || null,
        currentPage: 'contatti'
    });
});

// TERMINI E CONDIZIONI
router.get('/terminiCondizioni', (req, res) => {
    res.render('terminiCondizioni', {
        title: 'terminiCondizioni',
        user: req.user || null,
        currentPage: 'terminiCondizioni'
    });
});

// ADMIN (protetta)
router.get('/admin', isAdmin, (req, res) => {
    res.render('admin', {
        title: 'Pannello Admin',
        user: req.user, 
        currentPage: 'admin',
        extraJS: ['/js/admin.js'],
        extraCSS: ['/css/admin.css']
    });
});

//LOGIN
router.get('/accedi', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/');
    }

    res.render('accedi', {
        title: 'Accedi',
        user: req.user || null,
        errorMessage: req.flash('error'),
        successMessage: req.flash('success'),
        currentPage: 'accedi',
        formData: req.session.formData || null,
        extraJS: ['/js/accedi.js', '/js/password.js']
    });
    
    delete req.session.formData;
});


// REGISTRAZIONE
router.get('/registrati', (req, res) => {
    
    if (req.session && req.session.userId) {
        return res.redirect('/');
    }

    res.render('registrati', {
        title: 'Registrati',
        user: req.user || null,
        errorMessage: req.flash('error'),
        successMessage: req.flash('success'),
        currentPage: 'registrati',
        formData: req.session.formData || null,
        extraJS: ['/js/registrati.js', '/js/password.js'],
        metaDescription: 'Registrati su Trainly per iniziare il tuo percorso di allenamento personalizzato.'
    });
    
    delete req.session.formData;
});

// PROFILO
router.get('/profiloUtente', isAuthenticated, (req, res) => { 
    res.render('profiloUtente', {
        title: 'Il mio profilo',
        user: req.user, 
        currentPage: 'profiloUtente',
        extraJS: ['/js/profiloUtente.js', '/js/password.js']
    });
});

// POST Login
router.post('/accedi', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    
    if (!user) {
      const isAjax = req.xhr || 
                    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                    req.headers.accept.includes('application/json') ||
                    req.get('Content-Type') === 'application/json';
      
      if (isAjax) {
        return res.status(401).json({ 
          success: false,
          message: "Credenziali errate. Riprova." 
        });
      }
      
      req.flash('error', 'Credenziali errate');
      return res.redirect('/accedi');
    }
    
    req.logIn(user, (err) => {
      if (err) return next(err);
      
      const isAjax = req.xhr || 
                    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                    req.headers.accept.includes('application/json') ||
                    req.get('Content-Type') === 'application/json';
      
      if (isAjax) {
        return res.json({ 
          success: true, 
          message: "Login effettuato con successo",
          redirect: "/profiloUtente"
        });
      }
      
      return res.redirect('/profiloUtente');
    });
  })(req, res, next);
});



// POST Registrazione
router.post('/registrati', async (req, res) => {
    const { nome, cognome, email, password, confirmPassword, tipo } = req.body;
    const role = tipo || 'user';

    req.session.formData = { nome, cognome, email, role }; 

    try {
        const validationError = validateRegistrationData(req.body);
        if (validationError) {
            req.flash('error', validationError);
            return res.redirect('/registrati');
        }

        const userExists = await userDao.findByEmail(email); 
        if (userExists) {
            req.flash('error', 'Un utente con questa email è già registrato');
            return res.redirect('/registrati');
        }

        const newUser = await userDao.createUser({ 
            nome: nome.trim(),
            cognome: cognome.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            role: role 
        });

        console.log('Nuovo utente registrato:', newUser);

        delete req.session.formData;

        req.flash('success', 'Registrazione completata! Ora puoi accedere.');
        res.redirect('/accedi');
    } catch (error) {
        console.error('Errore registrazione:', error);
        req.flash('error', 'Errore durante la registrazione. Riprova.');
        res.redirect('/registrati');
    }
});

// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
        if (err) {
            console.error('Errore logout:', err);
            req.flash('error', 'Errore durante il logout');
            return res.redirect('/');
        }
        res.redirect('/?logout=success');
        });
    });
});


// Funzione helper per validazione registrazione
function validateRegistrationData(data) {
    const { nome, cognome, email, password, confirmPassword } = data;
    
    if (!nome || !cognome || !email || !password || !confirmPassword) {
        return 'Tutti i campi sono obbligatori';
    }
    
    if (nome.trim().length < 2 || cognome.trim().length < 2) {
        return 'Nome e cognome devono essere di almeno 2 caratteri';
    }
    
    if (password !== confirmPassword) {
        return 'Le password non corrispondono';
    }
    
    if (password.length < 8) {
        return 'La password deve essere di almeno 8 caratteri';
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
        return 'La password deve contenere almeno una lettera maiuscola, una minuscola, un numero e un carattere speciale';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Formato email non valido';
    }
    
    return null;
}


module.exports = router;