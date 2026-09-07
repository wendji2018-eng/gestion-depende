const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const verifierToken = require('./authMiddleware');

const db = require('./db');

// --- IMPORTATIONS DES FONCTIONS ---
const { inscrireUtilisateur, supprimerUtilisateur, obtenirInfosCompletesUtilisateur } = require('./utilisateur');
const { connecterUtilisateur } = require('./connexion');
const { obtenirCategories, ajouterCategorie } = require('./categories');
const { ajouterDepense, obtenirDepensesParUtilisateur, modifierDepense, supprimerDepense } = require('./depenses');
const { ajouterRevenu, modifierRevenu, supprimerRevenu, obtenirRevenusParUtilisateur } = require('./revenus');
const { calculerResteBudgetaire } = require('./ratios');


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 1. ROUTE DE TEST API
app.get('/api/status', (req, res) => {
    res.json({ success: true, message: 'Le serveur Node.js fonctionne !' });
});

// 2. ROUTES UTILISATEURS (Inscription & Connexion)

app.post('/api/inscription', async (req, res) => {
    const { nom, email, numero, motDePasse } = req.body;
    const resultat = await inscrireUtilisateur(nom, email, numero, motDePasse);
    
    if (resultat.success) {
        return res.status(201).json(resultat);
    }
    return res.status(400).json(resultat);
});

app.post('/api/connexion', async (req, res) => {
    const { email, motDePasse } = req.body;
    const resultat = await connecterUtilisateur(email, motDePasse);
    
    if (resultat.success) {
        return res.status(200).json(resultat);
    }
    return res.status(401).json(resultat);
});

// Route pour supprimer un utilisateur
app.delete('/api/utilisateurs/:id', async (req, res) => {
    try {
        const utilisateurId = req.params.id;
        const resultat = await supprimerUtilisateur(utilisateurId);
        
        if (resultat.success) return res.status(200).json(resultat);
        return res.status(404).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});


// 3. ROUTES CATÉGORIES

app.get('/api/categories', async (req, res) => {
    try {
        const resultat = await obtenirCategories();
        if (resultat.success) return res.status(200).json(resultat);
        return res.status(400).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});

app.post('/api/categories', async (req, res) => {
    try {
        const { nom } = req.body;
        const resultat = await ajouterCategorie(nom);
        if (resultat.success) return res.status(201).json(resultat);
        return res.status(400).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});


// 4. ROUTES DÉPENSES PRÉVISIONNELLES

app.post('/api/depenses', async (req, res) => {
    try {
        const { revenuId, categorieId, montantCat, titre, statut } = req.body;
        const resultat = await ajouterDepense(revenuId, categorieId, montantCat, titre, statut);
        if (resultat.success) return res.status(201).json(resultat);
        return res.status(400).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});

app.get('/api/depenses/:utilisateurId', async (req, res) => {
    try {
        const utilisateurId = req.params.utilisateurId;
        const resultat = await obtenirDepensesParUtilisateur(utilisateurId);
        if (resultat.success) return res.status(200).json(resultat);
        return res.status(400).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});

// Route pour modifier une dépense
app.put('/api/depenses/:id', async (req, res) => {
    try {
        const depenseId = req.params.id;
        const { revenuId, categorieId, montantCat, titre, statut } = req.body;
        const resultat = await modifierDepense(depenseId, revenuId, categorieId, montantCat, titre, statut);
        
        if (resultat.success) return res.status(200).json(resultat);
        return res.status(404).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});

// Route pour supprimer une dépense
app.delete('/api/depenses/:id', async (req, res) => {
    try {
        const depenseId = req.params.id;
        const resultat = await supprimerDepense(depenseId);
        
        if (resultat.success) return res.status(200).json(resultat);
        return res.status(404).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});


// 5. ROUTES REVENUS MENSUELS

app.post('/api/revenus', async (req, res) => {
    const { utilisateurId, montant, mois } = req.body;
    const resultat = await ajouterRevenu(utilisateurId, montant, mois);
    
    if (resultat.success) {
        return res.status(201).json(resultat);
    }
    return res.status(400).json(resultat);
});

app.get('/api/revenus/:utilisateurId', async (req, res) => {
    try {
        const utilisateurId = req.params.utilisateurId;
        const resultat = await obtenirRevenusParUtilisateur(utilisateurId);
        if (resultat.success) return res.status(200).json(resultat);
        return res.status(400).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});

// Route pour calculer le reste budgetaire
app.get('/api/revenus/:id/bilan', async (req, res) => {
    try {
        const revenuId = req.params.id;
        const resultat = await calculerResteBudgetaire(revenuId);
        if (resultat.success) return res.status(200).json(resultat);
        return res.status(404).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});

app.put('/api/revenus/:id', async (req, res) => {
    try {
        const idRevenu = req.params.id;
        const { utilisateurId, montant, mois } = req.body;
        const resultat = await modifierRevenu(idRevenu, utilisateurId, montant, mois);
        
        if (resultat.success) return res.status(200).json(resultat);
        return res.status(404).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});

app.delete('/api/revenus/:id', async (req, res) => {
    try {
        const idRevenu = req.params.id;
        const resultat = await supprimerRevenu(idRevenu);
        
        if (resultat.success) return res.status(200).json(resultat);
        return res.status(404).json(resultat);
    } catch (error) {
        console.error('Erreur serveur :', error);
        res.status(500).json({ success: false, message: 'Erreur interne du serveur' });
    }
});

// Route GET : /api/utilisateur/3/complet
app.get('/api/utilisateur/:id/complet', verifierToken, async (req, res) => {
    const utilisateurId = req.params.id;

    const resultat = await obtenirInfosCompletesUtilisateur(utilisateurId);

    if (!resultat.success) {
        return res.status(404).json(resultat);
    }

    res.status(200).json({
        success: true,
        message: "Informations récupérées avec succès",
        profil: resultat.donnees
    });
});


// 6. LANCEMENT DU SERVEUR

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});