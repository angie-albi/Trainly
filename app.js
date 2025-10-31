'use strict';

require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const { isAuthenticated, isAdmin } = require('./middleware/autorizzazioni');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurazione Passport
require('./middleware/passport')(passport);

// Middleware di base
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurazione sessione e Passport
const isProduction = process.env.NODE_ENV === 'production';

// Se l'app è dietro un proxy (come su Heroku, Render, ecc.)
if (isProduction) {
    app.set('trust proxy', 1); 
}

// Sessioni (prima di Passport)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax', 
        maxAge: 24 * 60 * 60 * 1000 // 1 giorno
    }
}));

// Passport (dopo sessioni)
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Passa info utente a tutti i template
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.messages = req.flash();
    next();
});

// Route principali
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Home - Trainly',
        user: req.user 
    });
});

app.get('/accedi', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/profiloUtente');
    }
    res.render('accedi', { 
        title: 'Accedi - Trainly',
        errorMessage: req.flash('error')[0] || null, 
        successMessage: req.flash('success')[0] || null
    });
});

app.get('/registrati', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/profiloUtente');
    }
    res.render('registrati', { 
        title: 'Registrati - Trainly',
        errorMessage: req.flash('error')[0] || null, 
        successMessage: req.flash('success')[0] || null
    });
});

// Solo utenti autenticati
app.get('/profiloUtente', isAuthenticated, (req, res) => {
    res.render('profiloUtente', { 
        title: 'Profilo - Trainly',
        user: req.user 
    });
});

// Solo admin
app.get('/admin', isAdmin, (req, res) => {
    res.render('admin', { 
        title: 'Admin Panel - Trainly',
        user: req.user 
    });
});

// Import delle route
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

// Usa le route
app.use('/', authRoutes);
app.use('/api', apiRoutes);

module.exports = app;
