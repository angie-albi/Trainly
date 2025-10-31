'use strict';

// Importazione delle dipendenze 
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const userDao = require('../models/dao/utenti-dao'); 

// Configurazione della strategia di autenticazione 
module.exports = function(passport) {
    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await userDao.findByEmail(email); 
                if (!user) {
                    return done(null, false, { message: 'Email non trovata' });
                }

                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    return done(null, false, { message: 'Password non corretta' });
                }
                return done(null, user);
                
            } catch (error) {
                return done(error);
            }
        }
    ));

    // Serializzazione dell'utente per la sessione
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserializzazione dell'utente dalla sessione
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userDao.findById(id); 
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
};