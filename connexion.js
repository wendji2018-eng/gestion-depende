const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db'); 

// Fonction pour connecter un utilisateur
async function connecterUtilisateur(email, motDePasseSaisi) {
    try {
        // 1. On cherche l'utilisateur dans la base de données grâce à son email
        const sql = 'SELECT * FROM UTILISATEUR WHERE `E-MAIL` = ?';
        const [rows] = await db.query(sql, [email]);

        // Si le tableau est vide, l'email n'existe pas
        if (rows.length === 0) {
            return { success: false, message: "Email ou mot de passe incorrect." };
        }

        const utilisateur = rows[0];

        // 2. On compare le mot de passe saisi avec le hash stocké en base
        const motDePasseCrypteEnBase = utilisateur['MOT DE PASSE'];
        const match = await bcrypt.compare(motDePasseSaisi, motDePasseCrypteEnBase);

        if (!match) {
            return { success: false, message: "Email ou mot de passe incorrect." };
        }

        // 3. Génération du jeton JWT
        const token = jwt.sign(
            { id: utilisateur.ID, email: utilisateur['E-MAIL'] },
            process.env.JWT_SECRET,
            { expiresIn: '2h' } // Le jeton expire dans 2 heures
        );

        // 4. Connexion réussie (avec inclusion du token)
        return { 
            success: true, 
            message: "Connexion réussie !", 
            token,
            utilisateur: {
                id: utilisateur.ID,
                nom: utilisateur.NOM,
                email: utilisateur['E-MAIL']
            } 
        };

    } catch (erreur) {
        console.error('Erreur SQL Connexion :', erreur);
        return { success: false, erreur: erreur.message };
    }
}

module.exports = { connecterUtilisateur };