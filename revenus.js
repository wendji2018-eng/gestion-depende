const db = require('./db');

// Fonction pour ajouter un revenu mensuel
const ajouterRevenu = async (utilisateurId, montant, mois) => {
    try {
        const query = 'INSERT INTO REVENU_MENSUEL (UTILISATEUR_ID, MONTANT, MOIS) VALUES (?, ?, ?)';
        console.log("Requête envoyée avec :", [utilisateurId, montant, mois]);
        
        const [result] = await db.query(query, [utilisateurId, montant, mois]);
        
        return { success: true, message: 'Revenu ajouté avec succès !', id: result.insertId };
    } catch (error) {
        console.error('ERREUR SQL BRUTE :', error);
        return { success: false, message: error.message }; 
    }
};

// Fonction pour récupérer les revenus d'un utilisateur
const obtenirRevenusParUtilisateur = async (utilisateurId) => {
    try {
        const query = 'SELECT * FROM REVENU_MENSUEL WHERE UTILISATEUR_ID = ? ORDER BY MOIS DESC';
        const [rows] = await db.query(query, [utilisateurId]);
        return { success: true, data: rows };
    } catch (error) {
        console.error('ERREUR SQL BRUTE (Lecture Revenus) :', error);
        return { success: false, message: error.message };
    }
};

// Fonction pour modifier un revenu existant
const modifierRevenu = async (idRevenu, utilisateurId, montant, mois) => {
    try {
        const query = 'UPDATE REVENU_MENSUEL SET UTILISATEUR_ID = ?, MONTANT = ?, MOIS = ? WHERE ID = ?';
        
        const [result] = await db.query(query, [utilisateurId, montant, mois, idRevenu]);
        
        if (result.affectedRows === 0) {
            return { success: false, message: 'Revenu non trouvé ou aucun changement effectué.' };
        }
        
        return { success: true, message: 'Revenu modifié avec succès !' };
    } catch (error) {
        console.error('ERREUR SQL BRUTE (Modification) :', error);
        return { success: false, message: error.message };
    }
};

// Fonction pour supprimer un revenu existant
const supprimerRevenu = async (idRevenu) => {
    try {
        const query = 'DELETE FROM REVENU_MENSUEL WHERE ID = ?';
        
        const [result] = await db.query(query, [idRevenu]);
        
        if (result.affectedRows === 0) {
            return { success: false, message: 'Revenu non trouvé.' };
        }
        
        return { success: true, message: 'Revenu supprimé avec succès !' };
    } catch (error) {
        console.error('ERREUR SQL BRUTE (Suppression) :', error);
        return { success: false, message: error.message };
    }
};

// Exportation
module.exports = { 
    ajouterRevenu, 
    obtenirRevenusParUtilisateur, 
    modifierRevenu, 
    supprimerRevenu 
};