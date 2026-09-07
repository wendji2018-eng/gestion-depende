# 🎨 ExpenseFlow : Application de Gestion des Dépenses

**ExpenseFlow** est une application web moderne et réactive, conçue pour simplifier et optimiser le suivi de vos dépenses personnelles. Avec une interface utilisateur intuitive et des fonctionnalités robustes, suivre et analyser vos finances n'a jamais été aussi facile.

## ✨ Fonctionnalités Principales

*   **📊 Dashboard Complet** :
    *   Visualisez vos dépenses totales du mois.
    *   Obtenez un aperçu rapide des dernières transactions.
    *   Consultez des graphiques interactifs pour une meilleure compréhension de vos habitudes de dépenses.

*   **➕ Ajout de Dépenses Facilité** :
    *   Interface simple pour enregistrer une nouvelle dépense.
    *   Formulaire guidé pour entrer le montant, la catégorie et une description.

*   **📂 Gestion des Transactions** :
    *   Vue d'ensemble de toutes vos dépenses enregistrées.
    *   Options de filtrage pour retrouver facilement une transaction spécifique.

*   **🎨 Design Moderne** :
    *   Interface utilisateur épurée avec des couleurs apaisantes et une typographie claire.
    *   Design responsive fonctionnant parfaitement sur mobile, tablette et ordinateur.
    *   Transitions fluides et expériences utilisateur agréables.

## 🛠️ Technologies Utilisées

Développé avec un ensemble de technologies de pointe pour offrir les meilleures performances et expériences:

*   **Framework** : **Next.js** (React Framework) - Pour une architecture serveur-client optimisée et un rendu rapide.
*   **Base de Données** : **PostgreSQL** - Système de base de données relationnelle puissant et fiable.
*   **Authentification & Sécurité** : **NextAuth.js** - Solution complète pour l'authentification sécurisée et la gestion des sessions.
*   **ORM & Outils de Développement** : **Prisma** - Outil de migration de base de données et client ORM pour des interactions sécurisées avec la base de données.
*   **Interface Utilisateur** : **NextUI** - Bibliothèque de composants React moderne optimisée pour Next.js.
*   **Styling & Animation** : **Tailwind CSS** - Framework CSS utilitaire pour un style rapide et personnalisable.
*   **Graphiques** : **Recharts** - Bibliothèque de graphiques React pour des visualisations de données attrayantes.

## 🚀 Démarrage Rapide

### Prérequis

Assurez-vous d'avoir installé les éléments suivants:

*   Node.js (v16 ou supérieur)
*   PostgreSQL (en cours d'exécution)

### Installation

1.  Clonez le dépôt :
    ```bash
    git clone <URL_DU_DEPOT>
    cd gestion-depende
    ```

2.  Installez les dépendances :
    ```bash
    npm install
    # ou
    yarn install
    ```

3.  Configurez les variables d'environnement :
    Copiez le fichier `.env.example` vers `.env` et configurez vos paramètres de base de données:
    ```bash
    cp .env.example .env
    ```
    Modifiez les variables `DATABASE_URL` et autres selon votre configuration.

4.  Migration de la base de données :
    Exécutez les migrations Prisma pour configurer votre base de données :
    ```bash
    npx prisma migrate dev --name init
    ```

5.  Générez le client Prisma :
    ```bash
    npx prisma generate
    ```

6.  Démarrez le serveur de développement :
    ```bash
    npm run dev
    # ou
    yarn dev
    ```

7.  Accédez à l'application :
    Ouvrez votre navigateur et accédez à `http://localhost:3000`.

## 📂 Structure du Projet

*   `app/`: Contient les routes de l'application (pages et layouts).
*   `components/`: Composants React partagés et réutilisables.
*   `lib/`: Fonctions utilitaires, configuration Prisma et helpers.
*   `prisma/`: Schéma de base de données Prisma et migrations.
*   `public/`: Fichiers statiques de l'application.
*   `styles/`: Styles globaux et variables CSS.

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.