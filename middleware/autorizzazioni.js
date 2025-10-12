'use strict';

// Verifica se l'utente è autenticato
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  req.flash('error', 'Devi effettuare il login per accedere a questa pagina.');
  return res.redirect('/accedi');
};

// Verifica se l'utente è admin
exports.isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Devi effettuare il login per accedere a questa pagina.');
    return res.redirect('/accedi');
  }

  if (req.user.role === 'admin') {
    return next();
  }

  req.flash('error', 'Non hai i permessi necessari per accedere a questa pagina.');
  return res.redirect('/accedi');
};