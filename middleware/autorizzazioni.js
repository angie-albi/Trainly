'use strict';

function isApiRequest(req) {
    return req.originalUrl.startsWith('/api');
}

// Verifica se l'utente è autenticato
exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  if (isApiRequest(req)) {
    return res.status(401).json({ success: false, message: 'Autenticazione richiesta.' });
  }

  req.flash('error', 'Devi effettuare il login per accedere a questa pagina.');
  return res.redirect('/accedi');
};

// Verifica se l'utente è admin
exports.isAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    if (isApiRequest(req)) {
        return res.status(401).json({ success: false, message: 'Autenticazione richiesta.' });
    }
    req.flash('error', 'Devi effettuare il login per accedere a questa pagina.');
    return res.redirect('/accedi');
  }

  if (req.user && req.user.role === 'admin') {
    return next();
  }

  if (isApiRequest(req)) {
    return res.status(403).json({ success: false, message: 'Permessi di amministratore richiesti.' });
  }

  req.flash('error', 'Non hai i permessi necessari per accedere a questa pagina.');
  return res.redirect('/');
};