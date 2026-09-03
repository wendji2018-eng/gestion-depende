const jwt = require('jsonwebtoken');

const verifierToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Accès refusé. Jeton manquant.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Jeton invalide ou expiré.' });
        }
        req.user = user; // Stocke les infos du token dans la requête
        next();
    });
};

module.exports = verifierToken;