const { connecterUtilisateur } = require('./connexion');

async function lancerTestConnexion() {
    console.log("Tentative de connexion...");

    // Utilise l'email et le mot de passe ("leroi") de l'utilisateur "Steve" qu'on vient d'inscrire
    const email = "steve@email.com";
    const motDePasse = "leroi"; 

    const resultat = await connecterUtilisateur(email, motDePasse);
    
    console.log("Résultat de la connexion :", resultat);
}

lancerTestConnexion();