const db = require('./db');

// Fonction pour calculer le reste

const calculerResteBudgetaire = async (revenuId) => {
    try {
        // 1. Récupérer le montant total du revenu
        
        const [revenuRows] = await db.query(
            'SELECT MONTANT FROM REVENU_MENSUEL WHERE ID = ?',
            [revenuId]
        );

        if (revenuRows.length === 0) {
            return { success: false, message: 'Revenu non trouvé.' };
        }

        const montantRevenu = revenuRows[0].MONTANT;

        // 2. Additionner toutes les dépenses prévisionnelles liées à ce revenu

        const [depenseRows] = await db.query(
            'SELECT SUM(MONTANT_CAT) AS totalDepenses FROM DEPENSE_PREVISIONNELLE WHERE REVENU_ID = ?',
            [revenuId]
        );

        const totalDepenses = depenseRows[0].totalDepenses || 0;

        // 3. Calculer le solde restant

        const reste = montantRevenu - totalDepenses;

        return {
            success: true,
            data: {
                revenuTotal: montantRevenu,
                totalDepensesPrevisionnelles: totalDepenses,
                resteBudgetaire: reste
            }
        };
    } catch (error) {
        console.error('ERREUR SQL (Calcul Reste) :', error);
        return { success: false, message: error.message };
    }
};

module.exports = { calculerResteBudgetaire };