const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Acesso negado. Nenhum usuário autenticado." });
    }
    req.user = req.session.user;
    next();
};

exports.isAdmin = (req, res, next) => {
    req.user = req.session.user;
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Acesso negado. Permissão Admin necessária." });
    }
    next();
};

