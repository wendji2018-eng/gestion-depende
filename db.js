const mysql = require('mysql2/promise'); 
require('dotenv').config();

// 2. Création du pool de connexion compatible async/await
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// 3. Test de connexion propre avec async/await
(async () => {
    try {
        const connection = await db.getConnection();
        console.log('Connecté avec succès à la base de données MySQL (XAMPP) !');
        connection.release(); // Libérer la connexion
    } catch (err) {
        console.error('Erreur de connexion à la base de données :', err);
    }
})();

module.exports = db;