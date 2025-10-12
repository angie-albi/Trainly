const express = require('express');
const router = express.Router();
// const db = require('../models/database'); // quando avrai il database

// Homepage
router.get('/', (req, res) => {
    // Esempio di dati che potresti recuperare dal database
    const prodotti = [
        {
            nome: 'Programmi',
            categoria: 'programma',
            descrizione: 'Programmi di allenamento standard, ideali per chi ha esperienza e cerca routine strutturate.'
        },
        {
            nome: 'Coaching',
            categoria: 'coaching',
            descrizione: 'Il coaching è un percorso personalizzato che include una scheda di allenamento su misura.'
        },
        {
            nome: 'E-book',
            categoria: 'e-book',
            descrizione: 'I nostri e-book fitness ti offrono strategie pratiche per migliorare i risultati.'
        }
    ];

    res.render('index', {
        title: 'Home',
        user: req.user || null,
        prodotti: prodotti,
        currentPage: 'home'
    });
});

// Contatti
router.get('/contatti', (req, res) => {
    res.render('contatti', {
        title: 'Contatti',
        user: req.user || null,
        currentPage: 'contatti'
    });
});

module.exports = router;