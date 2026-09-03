const db = require('./db');

// Fonction pour ajouter une dépense prévisionnelle
const ajouterDepense = async (revenuId, categorieId, montantCat, titre, statut) => {
    try {
        const query = 'INSERT INTO DEPENSE_PREVISIONNELLE (REVENU_ID, CATEGORIE_ID, MONTANT_CAT, TITRE, STATUT) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(query, [revenuId, categorieId, montantCat, titre, statut]);
        
        return { success: true, message: 'Dépense prévisionnelle ajoutée avec succès !', id: result.insertId };
    } catch (error) {
        console.error('ERREUR SQL BRUTE (Ajout Dépense) :', error);
        return { success: false, message: error.message };
    }
};

// Fonction pour récupérer toutes les dépenses (globales)
const obtenirDepenses = async () => {
    try {
        const query = 'SELECT * FROM DEPENSE_PREVISIONNELLE';
        const [rows] = await db.query(query);
        
        return { success: true, data: rows };
    } catch (error) {
        console.error('ERREUR SQL BRUTE (Lecture Dépenses) :', error);
        return { success: false, message: error.message };
    }
};

// Fonction pour modifier une dépense
const modifierDepense = async (depenseId, revenuId, categorieId, montantCat, titre, statut) => {
    try {
        const [result] = await db.query(
            'UPDATE DEPENSE_PREVISIONNELLE SET REVENU_ID = ?, CATEGORIE_ID = ?, MONTANT_CAT = ?, TITRE = ?, STATUT = ? WHERE ID = ?',
            [revenuId, categorieId, montantCat, titre, statut, depenseId]
        );

        if (result.affectedRows === 0) {
            return { success: false, message: 'Dépense prévisionnelle non trouvée.' };
        }

        return { success: true, message: 'Dépense mise à jour avec succès !' };
    } catch (error) {
        console.error('ERREUR SQL (Modifier Dépense) :', error);
        return { success: false, message: error.message };
    }
};

//  AJOUT DE LA FONCTION MANQUANTE 

const obtenirDepensesParUtilisateur = async (utilisateurId) => {
    try {
        const query = `
            SELECT d.* 
            FROM DEPENSE_PREVISIONNELLE d
            JOIN REVENU_MENSUEL r ON d.REVENU_ID = r.ID
            WHERE r.UTILISATEUR_ID = ?
        `;
        const [rows] = await db.query(query, [utilisateurId]);
        
        return { success: true, data: rows };
    } catch (error) {
        console.error('ERREUR SQL (Obtenir Dépenses par Utilisateur) :', error);
        return { success: false, message: error.message };
    }
};

// exports des fonctions 
module.exports = { 
    ajouterDepense, 
    obtenirDepenses, 
    modifierDepense, 
    obtenirDepensesParUtilisateur 
};