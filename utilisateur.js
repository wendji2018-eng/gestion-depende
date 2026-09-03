const bcrypt = require('bcrypt');
const db = require('./db'); 

// Fonction pour inscrire un utilisateur

async function inscrireUtilisateur(nom, email, numero, motDePasse) {
    try {
        // 1. Vérifier si l'email existe déjà

        const sqlVerification = 'SELECT * FROM UTILISATEUR WHERE `E-MAIL` = ?';
        const [utilisateurExistant] = await db.query(sqlVerification, [email]);

        if (utilisateurExistant.length > 0) {
            return { success: false, message: "Cet e-mail est déjà utilisé par un autre compte." };
        }

        // 2. Chiffrer le mot de passe

        const saltRounds = 10;
        const motDePasseCrypte = await bcrypt.hash(motDePasse, saltRounds);

        // 3. Insérer l'utilisateur

        const sqlInsertion = 'INSERT INTO UTILISATEUR (NOM, `E-MAIL`, NUMERO, `MOT DE PASSE`) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(sqlInsertion, [nom, email, numero, motDePasseCrypte]);

        return { success: true, message: "Utilisateur inscrit avec succès !", id: result.insertId };

    } catch (erreur) {
        console.error('Erreur SQL Inscription :', erreur);
        return { success: false, erreur: erreur.message };
    }
}



async function obtenirInfosCompletesUtilisateur(utilisateurId) {
    try {
        const sql = `
            SELECT 
                u.ID AS utilisateur_id,
                u.NOM AS utilisateur_nom,
                u.\`E-MAIL\` AS utilisateur_email,
                r.ID AS revenu_id,
                r.MONTANT AS revenu_montant,
                d.ID AS depense_id,
                d.TITRE AS depense_titre,
                d.MONTANT_CAT AS depense_montant,
                d.STATUT AS depense_statut
            FROM UTILISATEUR u
            LEFT JOIN REVENU_MENSUEL r ON u.ID = r.UTILISATEUR_ID
            LEFT JOIN DEPENSE_PREVISIONNELLE d ON r.ID = d.REVENU_ID
            WHERE u.ID = ?
        `;

        const [rows] = await db.query(sql, [utilisateurId]);

        // Si l'utilisateur n'existe pas du tout dans la base
        
        if (rows.length === 0) {
            return { success: false, message: "Utilisateur non trouvé." };
        }

        return { success: true, donnees: rows };

    } catch (erreur) {
        console.error('Erreur SQL :', erreur);
        return { success: false, erreur: erreur.message };
    }
}



const supprimerUtilisateur = async (utilisateurId) => {
    try {
        const [result] = await db.query(
            'DELETE FROM UTILISATEUR WHERE ID = ?',
            [utilisateurId]
        );

        if (result.affectedRows === 0) {
            return { success: false, message: 'Utilisateur non trouvé.' };
        }

        return { success: true, message: 'Utilisateur supprimé avec succès !' };
    } catch (error) {
        console.error('ERREUR SQL (Supprimer Utilisateur) :', error);
        return { success: false, message: error.message };
    }
};



module.exports = { inscrireUtilisateur, supprimerUtilisateur, obtenirInfosCompletesUtilisateur };