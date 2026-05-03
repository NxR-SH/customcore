# Configuration Supabase pour FiveM Dev Pro

## 🚀 Étapes de Configuration

### 1. Créer un Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte et un nouveau projet
3. Notez votre **URL du projet** et votre **clé publique (anon key)**

### 2. Configurer la Base de Données

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Copiez et exécutez le contenu du fichier `supabase-schema.sql`
3. Cela créera toutes les tables et politiques nécessaires

### 3. Configurer l'Authentification

1. Allez dans **Authentication** > **Settings**
2. Dans **Site URL**, ajoutez votre domaine : `https://votre-username.github.io`
3. Dans **Redirect URLs**, ajoutez :
   - `https://votre-username.github.io/fivem-dev-pro/reset-password.html`
   - `https://votre-username.github.io/fivem-dev-pro/dashboard.html`

### 4. Configurer l'Email

1. Dans **Authentication** > **Settings** > **SMTP Settings**
2. Configurez votre serveur SMTP ou utilisez celui de Supabase
3. Personnalisez les templates d'email si nécessaire

### 5. Créer le Compte Admin

1. Dans **Authentication** > **Users**
2. Cliquez sur **Add user**
3. Email : `nxrsh27@gmail.com`
4. Mot de passe temporaire (sera réinitialisé)
5. Cochez **Email confirmed**

### 6. Mettre à Jour la Configuration

Dans le fichier `supabase-config.js`, remplacez :

```javascript
const SUPABASE_URL = 'https://your-project-ref.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'
```

Par vos vraies valeurs Supabase.

## 🔐 Sécurité

### Row Level Security (RLS)

Le schéma inclut des politiques RLS qui garantissent :

- **Clients** : Peuvent seulement voir leurs propres données
- **Admin** : Peut voir et modifier toutes les données
- **Authentification** : Requise pour toutes les opérations

### Hachage des Mots de Passe

- Supabase gère automatiquement le hachage sécurisé des mots de passe
- Utilise bcrypt avec salt automatique
- Aucun mot de passe en clair n'est stocké

### Réinitialisation de Mot de Passe

- Email automatique avec lien sécurisé
- Token temporaire avec expiration
- Redirection vers page de réinitialisation

## 📊 Structure de la Base de Données

### Tables Principales

1. **user_profiles** : Profils utilisateur étendus
2. **quotes** : Devis clients
3. **invoices** : Factures
4. **subscriptions** : Abonnements

### Relations

- `quotes.user_id` → `auth.users.id`
- `invoices.user_id` → `auth.users.id`
- `invoices.quote_id` → `quotes.id`
- `subscriptions.user_id` → `auth.users.id`

## 🔧 Fonctionnalités Automatiques

### Triggers

- **Création de profil** : Automatique lors de l'inscription
- **Mise à jour timestamps** : `updated_at` automatique
- **Numérotation factures** : Séquentielle par année

### Fonctions

- `handle_new_user()` : Crée le profil utilisateur
- `generate_invoice_number()` : Génère les numéros de facture
- `update_updated_at_column()` : Met à jour les timestamps

## 🚀 Déploiement

### Variables d'Environnement

Pour la production, considérez utiliser des variables d'environnement :

```javascript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'your-fallback-url'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-fallback-key'
```

### GitHub Pages

Le site fonctionne parfaitement sur GitHub Pages car :
- Supabase gère l'authentification côté serveur
- Toutes les opérations sont via API REST
- Pas besoin de serveur backend

## 📧 Configuration Email Admin

### Première Connexion Admin

1. L'admin doit utiliser "Mot de passe oublié" sur la page de connexion
2. Un email de réinitialisation sera envoyé à `nxrsh27@gmail.com`
3. Suivre le lien pour définir un nouveau mot de passe
4. Le compte admin sera alors activé

### Templates Email

Personnalisez les templates dans **Authentication** > **Email Templates** :

- **Confirm signup** : Email de confirmation d'inscription
- **Reset password** : Email de réinitialisation
- **Magic link** : Connexion par lien magique (optionnel)

## 🔍 Monitoring

### Dashboard Supabase

Surveillez :
- **Authentification** : Connexions, inscriptions
- **Database** : Requêtes, performances
- **API** : Utilisation, erreurs
- **Storage** : Si vous ajoutez des fichiers plus tard

### Logs

Activez les logs pour débugger :
- Requêtes SQL
- Erreurs d'authentification
- Violations de politiques RLS

## 🆘 Dépannage

### Erreurs Communes

1. **CORS Error** : Vérifiez les URLs autorisées
2. **RLS Policy** : Vérifiez les politiques de sécurité
3. **Email non reçu** : Vérifiez la configuration SMTP
4. **Token expiré** : Régénérez un nouveau lien de réinitialisation

### Support

- Documentation : [supabase.com/docs](https://supabase.com/docs)
- Discord : [discord.supabase.com](https://discord.supabase.com)
- GitHub : [github.com/supabase/supabase](https://github.com/supabase/supabase)

## 🔧 Correction des Erreurs SQL

### Erreur "column user_id does not exist"

Si vous rencontrez cette erreur lors de l'exécution du schéma :

1. **Utilisez le script de correction** :
   - Allez dans l'éditeur SQL de Supabase
   - Copiez et collez le contenu de `fix-policies.sql`
   - Exécutez le script

2. **Ou recréez la base de données** :
   - Supprimez toutes les tables existantes
   - Réexécutez `supabase-schema.sql` (version corrigée)

### Structure des Tables

- **`user_profiles`** : `id` (UUID, clé primaire) référence `auth.users(id)`
- **`quotes`** : `user_id` (UUID) référence `auth.users(id)`
- **`invoices`** : `user_id` (UUID) référence `auth.users(id)`
- **`reviews`** : `user_id` (UUID) référence `auth.users(id)`

### Vérification

Utilisez le script de test `test-admin-protection.js` dans la console du navigateur pour vérifier que tout fonctionne correctement.