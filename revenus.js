const db = require('./db');

//fonction pour ajouter un revenu mensuel

const ajouterRevenu = async (utilisateurId, depenseId, montant, mois) => {
    try {
        const idDepenseFinal = depenseId !== undefined && depenseId !== '' ? depenseId : null;

        const query = 'INSERT INTO REVENU_MENSUEL (UTILISATEUR_ID, DEPENSE_ID, MONTANT, MOIS) VALUES (?, ?, ?, ?)';
        console.log("Requête envoyée avec :", [utilisateurId, idDepenseFinal, montant, mois]);
        
        const [result] = await db.query(query, [utilisateurId, idDepenseFinal, montant, mois]);
        
        return { success: true, message: 'Revenu ajouté avec succès !', id: result.insertId };
    } catch (error) {
        console.error('ERREUR SQL BRUTE :', error);
        return { success: false, message: error.message }; 
    }
};


//fonction pour modifier un revenu existant

const modifierRevenu = async (idRevenu, utilisateurId, depenseId, montant, mois) => {
    try {
        const idDepenseFinal = depenseId !== undefined && depenseId !== '' ? depenseId : null;

        const query = 'UPDATE REVENU_MENSUEL SET UTILISATEUR_ID = ?, DEPENSE_ID = ?, MONTANT = ?, MOIS = ? WHERE ID = ?';
        
        const [result] = await db.query(query, [utilisateurId, idDepenseFinal, montant, mois, idRevenu]);
        
        if (result.affectedRows === 0) {
            return { success: false, message: 'Revenu non trouvé ou aucun changement effectué.' };
        }
        
        return { success: true, message: 'Revenu modifié avec succès !' };
    } catch (error) {
        console.error('ERREUR SQL BRUTE (Modification) :', error);
        return { success: false, message: error.message };
    }
};

//fonction pour supprimer un revenu existant

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

// exportation
module.exports = { ajouterRevenu, modifierRevenu, supprimerRevenu };