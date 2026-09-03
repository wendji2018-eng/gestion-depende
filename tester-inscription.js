const { inscrireUtilisateur } = require('./utilisateur');

async function lancerLeTest() {
    console.log("Tentative d'inscription d'un utilisateur de test...");

    
    const nom = "Steve";
    const email = "steve@email.com";
    const numero = "670702829";
    const motDePasse = "leroi";

    const resultat = await inscrireUtilisateur(nom, email, numero, motDePasse);
    
    console.log("Résultat :", resultat);
}

lancerLeTest();