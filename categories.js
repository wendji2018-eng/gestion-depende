const db = require('./db');

// Fonction pour récupérer toutes les catégories
const obtenirCategories = async () => {
    try {
        const query = 'SELECT * FROM CATEGORIE';
        const [rows] = await db.query(query);
        
        return { success: true, data: rows };
    } catch (error) {
        console.error('ERREUR SQL BRUTE (Lecture Catégories) :', error);
        return { success: false, message: error.message };
    }
};

// Fonction pour ajouter une nouvelle catégorie
const ajouterCategorie = async (nom) => {
    try {
        const query = 'INSERT INTO CATEGORIE (NOM_CATEGORIE) VALUES (?)';
        const [result] = await db.query(query, [nom]);
        
        return { success: true, message: 'Catégorie ajoutée avec succès !', id: result.insertId };
    } catch (error) {
        console.error('ERREUR SQL BRUTE (Ajout Catégorie) :', error);
        return { success: false, message: error.message };
    }
};

module.exports = { obtenirCategories, ajouterCategorie };