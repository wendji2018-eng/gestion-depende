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

// Fonction pour récupérer les revenus d'un utilisateur (avec pagination et filtrage)
const obtenirRevenusParUtilisateur = async (utilisateurId, page = 1, limit = 5, search = '') => {
    try {
        // Mode 'all' pour récupérer tous les revenus (utilisé pour les sélecteurs / formulaires)
        if (page === 'all' || limit === 'all') {
            let allQuery = 'SELECT * FROM REVENU_MENSUEL WHERE UTILISATEUR_ID = ?';
            let allParams = [utilisateurId];
            if (search && search.trim() !== '') {
                allQuery += ' AND MOIS LIKE ?';
                allParams.push(`%${search.trim()}%`);
            }
            allQuery += ' ORDER BY MOIS DESC';
            const [rows] = await db.query(allQuery, allParams);
            return {
                success: true,
                data: rows,
                pagination: {
                    page: 1,
                    limit: rows.length || 1,
                    total: rows.length,
                    totalPages: 1
                }
            };
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 5);
        const offset = (pageNum - 1) * limitNum;

        let countQuery = 'SELECT COUNT(*) AS total FROM REVENU_MENSUEL WHERE UTILISATEUR_ID = ?';
        let dataQuery = 'SELECT * FROM REVENU_MENSUEL WHERE UTILISATEUR_ID = ? ORDER BY MOIS DESC LIMIT ? OFFSET ?';
        let countParams = [utilisateurId];
        let dataParams = [utilisateurId, limitNum, offset];

        if (search && search.trim() !== '') {
            const searchPattern = `%${search.trim()}%`;
            countQuery = 'SELECT COUNT(*) AS total FROM REVENU_MENSUEL WHERE UTILISATEUR_ID = ? AND MOIS LIKE ?';
            dataQuery = 'SELECT * FROM REVENU_MENSUEL WHERE UTILISATEUR_ID = ? AND MOIS LIKE ? ORDER BY MOIS DESC LIMIT ? OFFSET ?';
            countParams = [utilisateurId, searchPattern];
            dataParams = [utilisateurId, searchPattern, limitNum, offset];
        }

        const [countRows] = await db.query(countQuery, countParams);
        const total = countRows[0] ? countRows[0].total : 0;

        const [rows] = await db.query(dataQuery, dataParams);
        const totalPages = Math.ceil(total / limitNum) || 1;

        return {
            success: true,
            data: rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages
            }
        };
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