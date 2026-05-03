# FiveM Dev Pro - Site Web Professionnel

Site web statique complet pour vendre des services de développement FiveM avec système de paiement intégré et génération automatique de factures.

## 🚀 Fonctionnalités

### ✅ Fonctionnalités Implémentées
- **Site 100% statique** compatible GitHub Pages
- **Design moderne** inspiré GTA/Gaming avec thème sombre et néon
- **Responsive** (mobile + desktop)
- **Page d'accueil** avec présentation des services, portfolio et avis clients
- **Page services** avec système de devis à l'heure (25€/h)
- **Système d'authentification** complet (connexion/inscription)
- **Dashboard client** avec gestion des factures et abonnements
- **Panneau d'administration** pour gérer devis, clients et factures
- **Intégration paiement** Stripe pour les devis approuvés
- **Génération automatique de factures PDF** côté client
- **Stockage local** des données (localStorage)
- **Animations** et effets visuels
- **SEO optimisé** pour FiveM/GTA RP

### 🎯 Services Proposés
1. **Création de scripts complets** (2-20h selon complexité)
2. **Ajout de fonctionnalités** (1-8h selon fonctionnalité)
3. **Correction de bugs / Optimisation** (0.5-4h selon problème)
4. **Systèmes métier, UI, interactions** (5-30h selon système)

## 🛠️ Configuration

### 1. Clés API à Configurer

#### Stripe
```javascript
// Dans script.js, ligne 5
const STRIPE_PUBLIC_KEY = 'pk_test_51234567890abcdef'; // Remplacez par votre clé publique Stripe
```

### 2. Intégration Paiement Réelle

#### Pour Stripe :
1. Créez un compte sur [Stripe](https://stripe.com)
2. Récupérez votre clé publique de test puis de production
3. Le système utilise Stripe Checkout pour les paiements sécurisés
4. Configurez les webhooks pour confirmer les paiements automatiquement

#### URLs de redirection :
- **Succès** : `https://votre-site.com/success.html?quote=QUOTE_ID`
- **Annulation** : `https://votre-site.com/services.html#dashboard`

## 📁 Structure du Projet

```
fivem-dev-pro/
├── index.html          # Page d'accueil
├── services.html       # Page services et commandes
├── style.css          # Styles CSS complets
├── script.js          # JavaScript avec toutes les fonctionnalités
└── README.md          # Documentation
```

## 🚀 Déploiement GitHub Pages

### 1. Créer le Repository
```bash
git init
git add .
git commit -m "Initial commit - FiveM Dev Pro website"
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/fivem-dev-pro.git
git push -u origin main
```

### 2. Activer GitHub Pages
1. Allez dans **Settings** > **Pages**
2. Source : **Deploy from a branch**
3. Branch : **main** / **(root)**
4. Cliquez **Save**

### 3. Votre site sera disponible à :
`https://VOTRE-USERNAME.github.io/fivem-dev-pro/`

## 👥 Système d'Authentification

### 🔐 Comptes de Démonstration
- **Admin** : admin@fivemdevpro.com / admin123
- **Client** : client@example.com / client123

### 🎯 Fonctionnalités Auth
- **Inscription** avec validation complète
- **Connexion** sécurisée
- **Gestion des rôles** (admin/client)
- **Navigation dynamique** selon le statut
- **Protection des pages** sensibles

### 📊 Dashboard Client
- **Factures** avec statuts et paiement
- **Abonnements** avec gestion
- **Statistiques** personnelles
- **Téléchargement PDF** des factures
- **Historique complet** des transactions

### 🛠️ Panneau Admin
- **Gestion des devis** (approuver/refuser)
- **Gestion des clients** (activer/désactiver)
- **Création de factures** automatique
- **Statistiques globales** du business
- **Interface complète** de gestion

## 💡 Personnalisation

### Modifier les Services
Éditez les sections dans `index.html` et `services.html` :
- Prix des packs
- Descriptions des services
- Fonctionnalités incluses

### Changer les Couleurs
Modifiez les variables CSS dans `style.css` :
```css
:root {
    --primary-color: #00ff88;    /* Vert néon */
    --secondary-color: #ff6b35;  /* Orange */
    --accent-color: #00d4ff;     /* Bleu cyan */
}
```

### Ajouter des Images
Remplacez les placeholders par de vraies images :
- Portfolio : Ajoutez des captures d'écran de vos projets
- Avatars clients : Photos ou avatars personnalisés

## 📊 Fonctionnalités Avancées

### Génération de Factures
- Utilise **jsPDF** pour créer des PDF côté client
- Inclut toutes les informations légales
- Téléchargement automatique après paiement

### Stockage Local
- Formulaires sauvegardés automatiquement
- Historique des commandes persistant
- Dashboard avec statistiques

### Animations
- Effets de scroll personnalisés
- Animations CSS fluides
- Loader avec effet néon

## 🔧 Développement Local

### Serveur Local Simple
```bash
# Python 3
python -m http.server 8000

# Node.js (avec live-server)
npx live-server

# PHP
php -S localhost:8000
```

Accédez à `http://localhost:8000`

## 📱 Responsive Design

Le site s'adapte automatiquement :
- **Desktop** : Layout complet avec sidebar
- **Tablet** : Grille adaptée
- **Mobile** : Menu hamburger, colonnes empilées

## 🎨 Thème Gaming/GTA

### Éléments Visuels
- Couleurs néon (vert, cyan, orange)
- Fond sombre avec grille
- Effets de glow et ombres
- Animations fluides
- Typographie moderne

### Inspiration GTA RP
- Palette de couleurs Vice City/Los Santos
- Effets lumineux urbains
- Interface style jeu vidéo

## 📈 SEO Optimisé

### Mots-clés Ciblés
- FiveM, développement, scripts
- ESX, QBCore, GTA RP
- Serveur, développeur, UI
- Optimisation, bot Discord

### Balises Meta
- Descriptions optimisées
- Mots-clés pertinents
- Open Graph pour réseaux sociaux

## 🔒 Sécurité

### Bonnes Pratiques
- Validation côté client
- Sanitisation des données
- Clés API en environnement sécurisé
- HTTPS obligatoire pour les paiements

## 📞 Support

Pour toute question ou personnalisation :
- Email : contact@fivemdevpro.com
- Discord : FiveM Dev Pro#1234

## 📄 Licence

Ce projet est sous licence MIT. Vous pouvez l'utiliser et le modifier librement pour vos projets commerciaux.

---

**Prêt à lancer votre business FiveM ! 🚀**