// Script de démonstration pour tester les fonctionnalités
// Exécutez ce script dans la console du navigateur pour ajouter des données de test

function setupDemoData() {
    console.log('🚀 Configuration des données de démonstration...');
    
    // Données de devis fictifs pour le dashboard
    const demoQuotes = [
        {
            id: 'QUOTE-1K2L3M4N5O-ABCDE',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 7 jours
            clientName: 'Alexandre Martin',
            clientEmail: 'alex.martin@example.com',
            serverName: 'Los Santos RP',
            projectType: 'creation',
            projectDetails: 'Script de banque avec interface moderne et système de prêts',
            framework: 'esx',
            deadline: '1-week',
            budget: '250-500',
            status: 'approved',
            hourlyRate: 25,
            estimatedHours: 10,
            totalPrice: 250,
            vat: 50,
            totalWithVat: 300,
            approvedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'QUOTE-2K3L4M5N6O-FGHIJ',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 3 jours
            clientName: 'Sarah Dubois',
            clientEmail: 'sarah.dubois@example.com',
            serverName: 'Vice City Life',
            projectType: 'modification',
            projectDetails: 'Ajout d\'un système de whitelist automatique au bot Discord existant',
            framework: 'qbcore',
            deadline: '2-weeks',
            budget: '100-250',
            status: 'pending',
            hourlyRate: 25
        },
        {
            id: 'QUOTE-3K4L5M6N7O-KLMNO',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Hier
            clientName: 'Kevin Rodriguez',
            clientEmail: 'kevin.rodriguez@example.com',
            serverName: 'Liberty City RP',
            projectType: 'systems',
            projectDetails: 'Développement complet d\'un système de concessionnaire avec test drive et financement',
            framework: 'esx',
            deadline: '1-month',
            budget: '500+',
            status: 'paid',
            hourlyRate: 25,
            estimatedHours: 15,
            totalPrice: 375,
            vat: 75,
            totalWithVat: 450,
            approvedDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            paidDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            paymentIntentId: 'pi_demo123456789'
        },
        {
            id: 'QUOTE-4K5L6M7N8O-PQRST',
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Il y a 10 jours
            clientName: 'Marie Leroy',
            clientEmail: 'marie.leroy@example.com',
            serverName: 'San Andreas RP',
            projectType: 'debug',
            projectDetails: 'Correction de bugs sur le script de job policier et optimisation des performances',
            framework: 'esx',
            deadline: 'urgent',
            budget: '25-100',
            status: 'pending',
            hourlyRate: 25
        }
    ];
    
    // Sauvegarder les devis de démonstration
    localStorage.setItem('fiveM_quotes', JSON.stringify(demoQuotes));
    
    // Données de formulaire pré-remplies
    const demoFormData = {
        clientName: 'Jean Dupont',
        clientEmail: 'jean.dupont@example.com',
        serverName: 'Mon Serveur RP',
        projectType: 'creation',
        projectDetails: 'Je souhaite un script de job policier avec interface moderne, système d\'amendes, et intégration avec la base de données des véhicules...',
        framework: 'esx',
        deadline: '1-week',
        budget: '250-500',
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('fiveM_form_data', JSON.stringify(demoFormData));
    
    console.log('✅ Données de démonstration configurées !');
    console.log(`📊 ${demoQuotes.length} demandes de devis ajoutées`);
    console.log('📝 Formulaire pré-rempli');
    console.log('🔄 Rechargez la page pour voir les changements');
    
    return {
        quotes: demoQuotes.length,
        estimatedValue: demoQuotes.reduce((sum, quote) => {
            const estimates = { creation: 10, modification: 4, debug: 2, systems: 15 };
            return sum + (estimates[quote.projectType] || 5) * quote.hourlyRate;
        }, 0)
    };
}

function clearDemoData() {
    console.log('🧹 Suppression des données de démonstration...');
    
    localStorage.removeItem('fiveM_quotes');
    localStorage.removeItem('fiveM_form_data');
    
    console.log('✅ Données supprimées !');
    console.log('🔄 Rechargez la page pour voir les changements');
}

function showDemoInstructions() {
    console.log(`
🎮 FIVEM DEV PRO - GUIDE DE DÉMONSTRATION

📋 COMMANDES DISPONIBLES :
• setupDemoData()     - Ajouter des données de test
• clearDemoData()     - Supprimer toutes les données
• showDemoInstructions() - Afficher ce guide

🧪 FONCTIONNALITÉS À TESTER :

1. 📊 DASHBOARD
   - Allez sur services.html#dashboard
   - Vérifiez les statistiques et l'historique des devis
   - Testez les boutons d'action (Simuler approbation, Payer)

2. 🛒 DEMANDE DE DEVIS
   - Cliquez sur une carte de service
   - Remplissez le formulaire de devis
   - Testez la validation et l'envoi

3. 💳 PROCESSUS DE PAIEMENT
   - Simulez l'approbation d'un devis en attente
   - Cliquez sur "Payer" pour un devis approuvé
   - Testez le checkout Stripe (mode test)

4. 📄 GÉNÉRATION DE FACTURE
   - Complétez un paiement
   - La facture PDF se télécharge automatiquement

5. 💾 SAUVEGARDE LOCALE
   - Toutes les données sont sauvées dans localStorage
   - Persistent entre les sessions

🔧 CONFIGURATION REQUISE POUR LA PRODUCTION :

1. Remplacez la clé API Stripe dans script.js :
   - STRIPE_PUBLIC_KEY

2. Configurez les webhooks Stripe pour confirmer les paiements

3. Déployez sur GitHub Pages

🚀 PRÊT À TESTER !
    `);
}

// Afficher les instructions au chargement
showDemoInstructions();