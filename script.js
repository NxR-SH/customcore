// Global Variables
let selectedServiceData = null;
let stripe = null;

// Stripe Configuration (remplacez par votre clé publique)
const STRIPE_PUBLIC_KEY = 'pk_live_51S9pVhLMhsvAN3BfwBwustb8XshGZjuDbw6TBXKjbA7SUIxwtkgAm4tUe8M11BUaZwtSCSWGzmT6uXfXWVwUSxzl00H3DLNPmf'; // Remplacez par votre vraie clé

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize loader
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }, 1500);

    // Initialize navigation
    initializeNavigation();
    
    // Initialize animations
    initializeAnimations();
    
    // Initialize services page functionality
    if (window.location.pathname.includes('services.html')) {
        initializeServicesPage();
    }
    
    // Initialize dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        initializeDashboard();
    }
    
    // Initialize homepage content
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        initializeHomepage();
    }
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
});

// Navigation Functions
function initializeNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Animation Functions
function initializeAnimations() {
    // Simple AOS-like animation observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);
    
    // Observe all elements with data-aos attribute
    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });
}

// Smooth Scrolling
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Services Page Functions
function initializeServicesPage() {
    // Initialize Stripe
    if (typeof Stripe !== 'undefined') {
        stripe = Stripe(STRIPE_PUBLIC_KEY);
    }
    
    // Initialize form validation
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('input', validateQuoteForm);
        orderForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Initialize quote request button
    const quoteBtn = document.getElementById('requestQuote');
    
    if (quoteBtn) {
        quoteBtn.addEventListener('click', handleQuoteRequest);
    }
    
    // Add click handlers to service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', () => {
            const serviceType = card.getAttribute('data-service');
            if (serviceType) {
                selectService(serviceType);
            }
        });
    });
    
    // Load saved form data
    loadSavedFormData();
}

// Service Selection
function selectService(serviceType) {
    // Scroll to quote form
    const orderSection = document.getElementById('commande');
    if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Pre-select the service type in the form
    const projectTypeSelect = document.getElementById('projectType');
    if (projectTypeSelect) {
        projectTypeSelect.value = serviceType;
        validateQuoteForm(); // Trigger validation
    }
    
    // Highlight selected service card
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-service="${serviceType}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
}

// Form Validation for Quote
function validateQuoteForm() {
    const form = document.getElementById('orderForm');
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
        }
    });
    
    // Update quote button state
    const quoteBtn = document.getElementById('requestQuote');
    if (quoteBtn) {
        quoteBtn.disabled = !isValid;
    }
    
    return isValid;
}

// Handle Form Submit
function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateQuoteForm()) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    // Save form data
    saveFormData();
}

// Handle Quote Request
async function handleQuoteRequest() {
    if (!validateQuoteForm()) {
        alert('Veuillez remplir tous les champs obligatoires avant de demander un devis.');
        return;
    }
    
    // Save form data
    saveFormData();
    
    // Create quote request
    const quoteData = {
        client_name: document.getElementById('clientName').value,
        client_email: document.getElementById('clientEmail').value,
        server_name: document.getElementById('serverName').value,
        project_type: document.getElementById('projectType').value,
        project_details: document.getElementById('projectDetails').value,
        framework: document.getElementById('framework').value,
        deadline: document.getElementById('deadline').value,
        budget: document.getElementById('budget').value,
        status: 'pending',
        hourly_rate: 25
    };
    
    try {
        // Save quote request to Supabase
        const { data, error } = await supabase
            .from('quotes')
            .insert([quoteData])
            .select()
            .single();

        if (error) throw error;

        // Show success message
        showQuoteSuccessMessage(data);
        
        // Reset form
        resetQuoteForm();
    } catch (error) {
        console.error('Error saving quote:', error);
        alert('Erreur lors de l\'envoi du devis. Veuillez réessayer.');
    }
}

// Save Form Data
function saveFormData() {
    const formData = {
        clientName: document.getElementById('clientName').value,
        clientEmail: document.getElementById('clientEmail').value,
        serverName: document.getElementById('serverName').value,
        projectType: document.getElementById('projectType').value,
        projectDetails: document.getElementById('projectDetails').value,
        framework: document.getElementById('framework').value,
        deadline: document.getElementById('deadline').value,
        budget: document.getElementById('budget').value,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('fiveM_form_data', JSON.stringify(formData));
}

// Load Saved Form Data
function loadSavedFormData() {
    const savedData = localStorage.getItem('fiveM_form_data');
    if (!savedData) return;
    
    try {
        const formData = JSON.parse(savedData);
        
        Object.keys(formData).forEach(key => {
            const field = document.getElementById(key);
            if (field && formData[key]) {
                field.value = formData[key];
            }
        });
        
        // Trigger validation after loading
        validateQuoteForm();
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
}

// Remove the old localStorage functions
// Generate Quote ID - no longer needed with Supabase auto-generated IDs
// Save Quote Request - replaced with Supabase insert

// Show Quote Success Message
function showQuoteSuccessMessage(quoteData) {
    const projectTypeNames = {
        'creation': 'Création de script complet',
        'modification': 'Ajout de fonctionnalités',
        'debug': 'Correction de bugs / Optimisation',
        'systems': 'Systèmes métier, UI, interactions'
    };
    
    alert(`Demande de devis envoyée !\n\nNuméro: ${quoteData.id}\nType: ${projectTypeNames[quoteData.project_type]}\n\nJe vous répondrai sous 24h avec un devis détaillé.\nMerci pour votre confiance !`);
}

// Reset Quote Form
function resetQuoteForm() {
    const form = document.getElementById('orderForm');
    if (form) {
        form.reset();
    }
    
    // Reset button state
    const quoteBtn = document.getElementById('requestQuote');
    if (quoteBtn) {
        quoteBtn.disabled = true;
    }
    
    // Remove service selection
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Payment Functions (for approved quotes)
async function processPayment(quoteId, amount, description) {
    if (!stripe) {
        alert('Erreur: Stripe non initialisé. Veuillez recharger la page.');
        return;
    }
    
    try {
        // Create Stripe Checkout Session
        const { error } = await stripe.redirectToCheckout({
            lineItems: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: description,
                        description: `Devis: ${quoteId}`,
                    },
                    unit_amount: Math.round(amount * 100), // Stripe expects cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            successUrl: `${window.location.origin}/success.html?quote=${quoteId}`,
            cancelUrl: `${window.location.origin}/services.html#dashboard`,
            metadata: {
                quoteId: quoteId,
                type: 'quote_payment'
            }
        });

        if (error) {
            console.error('Erreur Stripe:', error);
            alert('Erreur lors de la redirection vers le paiement: ' + error.message);
        }
    } catch (error) {
        console.error('Erreur lors du paiement:', error);
        alert('Erreur lors du paiement. Veuillez réessayer.');
    }
}

// Simulate quote approval and payment (for demo)
async function simulateQuoteApproval(quoteId) {
    try {
        const { data: quote, error: fetchError } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (fetchError) throw fetchError;
        
        if (!quote) {
            alert('Devis non trouvé');
            return;
        }
        
        // Simulate quote approval with estimated price
        const estimates = {
            'creation': 10,
            'modification': 4,
            'debug': 2,
            'systems': 15
        };
        
        const estimatedHours = estimates[quote.project_type] || 5;
        const totalPrice = estimatedHours * (quote.hourly_rate || 25);
        const vat = Math.round(totalPrice * 0.2 * 100) / 100;
        const totalWithVat = totalPrice + vat;
        
        const projectTypeNames = {
            'creation': 'Création de script complet',
            'modification': 'Ajout de fonctionnalités',
            'debug': 'Correction de bugs / Optimisation',
            'systems': 'Systèmes métier, UI, interactions'
        };
        
        const confirmed = confirm(
            `Devis approuvé !\n\n` +
            `Projet: ${projectTypeNames[quote.project_type]}\n` +
            `Estimation: ${estimatedHours}h × ${quote.hourly_rate || 25}€ = ${totalPrice}€\n` +
            `TVA (20%): ${vat}€\n` +
            `Total: ${totalWithVat}€\n\n` +
            `Voulez-vous procéder au paiement ?`
        );
        
        if (confirmed) {
            // Update quote status
            const { error: updateError } = await supabase
                .from('quotes')
                .update({
                    status: 'approved',
                    estimated_hours: estimatedHours,
                    total_price: totalPrice,
                    vat: vat,
                    total_with_vat: totalWithVat,
                    approved_at: new Date().toISOString()
                })
                .eq('id', quoteId);

            if (updateError) throw updateError;
            
            // Process payment
            processPayment(
                quoteId, 
                totalWithVat, 
                `${projectTypeNames[quote.project_type]} - ${quote.client_name}`
            );
        }
    } catch (error) {
        console.error('Error simulating quote approval:', error);
        alert('Erreur lors de la simulation d\'approbation');
    }
}

// Handle successful payment (called from success page)
async function handleSuccessfulPayment(quoteId, paymentIntentId) {
    try {
        const { error } = await supabase
            .from('quotes')
            .update({
                status: 'paid',
                payment_intent_id: paymentIntentId,
                paid_at: new Date().toISOString()
            })
            .eq('id', quoteId);

        if (error) throw error;

        // Get updated quote for invoice generation
        const { data: quote, error: fetchError } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (fetchError) throw fetchError;

        // Generate invoice
        if (quote) {
            generateInvoice(quote);
        }
    } catch (error) {
        console.error('Error handling successful payment:', error);
    }
}

// Generate Invoice PDF
async function generateInvoice(quote) {
    // Re-add jsPDF for invoice generation
    if (typeof jsPDF === 'undefined') {
        // Dynamically load jsPDF
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => generateInvoicePDF(quote);
        document.head.appendChild(script);
    } else {
        generateInvoicePDF(quote);
    }
}

function generateInvoicePDF(quote) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const projectTypeNames = {
        'creation': 'Création de script complet',
        'modification': 'Ajout de fonctionnalités',
        'debug': 'Correction de bugs / Optimisation',
        'systems': 'Systèmes métier, UI, interactions'
    };
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 255, 136);
    doc.text('FACTURE', 20, 30);
    
    // Company info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('FiveM Dev Pro', 20, 50);
    doc.text('Développeur FiveM - Scripts sur mesure', 20, 60);
    doc.text('contact@fivemdevpro.com', 20, 70);
    
    // Invoice details
    doc.text(`Facture N°: ${quote.id}`, 120, 50);
    doc.text(`Date: ${new Date(quote.paid_at).toLocaleDateString('fr-FR')}`, 120, 60);
    doc.text(`Statut: Payée`, 120, 70);
    
    // Client info
    doc.setFontSize(14);
    doc.text('Facturé à:', 20, 100);
    doc.setFontSize(12);
    doc.text(quote.client_name, 20, 110);
    doc.text(quote.client_email, 20, 120);
    if (quote.server_name) {
        doc.text(`Serveur: ${quote.server_name}`, 20, 130);
    }
    
    // Services table
    doc.setFontSize(14);
    doc.text('Services:', 20, 160);
    
    // Table header
    doc.setFontSize(10);
    doc.text('Description', 20, 175);
    doc.text('Heures', 100, 175);
    doc.text('Taux horaire', 130, 175);
    doc.text('Total', 170, 175);
    
    // Table line
    doc.line(20, 178, 190, 178);
    
    // Service line
    doc.text(projectTypeNames[quote.project_type], 20, 190);
    doc.text(`${quote.estimated_hours}h`, 100, 190);
    doc.text(`€${quote.hourly_rate}`, 130, 190);
    doc.text(`€${quote.total_price}`, 170, 190);
    
    // Project details
    doc.setFontSize(8);
    const details = quote.project_details.substring(0, 100) + (quote.project_details.length > 100 ? '...' : '');
    doc.text(`Détails: ${details}`, 20, 200);
    
    // Totals
    doc.setFontSize(10);
    doc.line(20, 210, 190, 210);
    doc.text(`Sous-total: €${quote.total_price}`, 130, 225);
    doc.text(`TVA (20%): €${quote.vat}`, 130, 235);
    doc.setFontSize(12);
    doc.text(`TOTAL: €${quote.total_with_vat}`, 130, 250);
    
    // Payment info
    doc.setFontSize(10);
    doc.text(`Méthode de paiement: STRIPE`, 20, 270);
    if (quote.payment_intent_id) {
        doc.text(`ID de transaction: ${quote.payment_intent_id}`, 20, 280);
    }
    
    // Footer
    doc.text('Merci pour votre confiance !', 20, 290);
    doc.text('Travail sérieux, rapide et adapté à vos attentes.', 20, 300);
    
    // Download
    doc.save(`Facture_${quote.id}.pdf`);
}

// Dashboard Functions
async function initializeDashboard() {
    await updateDashboardStats();
    await displayQuotesHistory();
}

async function updateDashboardStats() {
    try {
        const { data: quotes, error } = await supabase
            .from('quotes')
            .select('*');

        if (error) throw error;

        const totalOrdersEl = document.getElementById('totalOrders');
        const totalSpentEl = document.getElementById('totalSpent');
        
        if (totalOrdersEl) {
            totalOrdersEl.textContent = quotes?.length || 0;
        }
        
        if (totalSpentEl) {
            // Calculate estimated value based on quotes
            const estimatedValue = quotes?.reduce((sum, quote) => {
                const estimates = {
                    'creation': 10,
                    'modification': 4,
                    'debug': 2,
                    'systems': 15
                };
                return sum + (estimates[quote.project_type] || 5) * (quote.hourly_rate || 25);
            }, 0) || 0;
            totalSpentEl.textContent = `€${estimatedValue}`;
        }
    } catch (error) {
        console.error('Error updating dashboard stats:', error);
    }
}

async function displayQuotesHistory() {
    const ordersTableEl = document.getElementById('ordersTable');
    if (!ordersTableEl) return;
    
    try {
        const { data: quotes, error } = await supabase
            .from('quotes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (!quotes || quotes.length === 0) {
            ordersTableEl.innerHTML = '<p class="no-orders">Aucune demande de devis pour le moment</p>';
            return;
        }
        
        const projectTypeNames = {
            'creation': 'Création de script',
            'modification': 'Ajout de fonctionnalités',
            'debug': 'Correction/Optimisation',
            'systems': 'Systèmes métier/UI'
        };
        
        const tableHTML = `
            <table class="orders-table-content">
                <thead>
                    <tr>
                        <th>Devis</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Framework</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${quotes.map(quote => `
                        <tr>
                            <td>${quote.id}</td>
                            <td>${new Date(quote.created_at).toLocaleDateString('fr-FR')}</td>
                            <td>${projectTypeNames[quote.project_type] || quote.project_type}</td>
                            <td>${quote.framework.toUpperCase()}</td>
                            <td><span class="status-badge status-${quote.status}">${getStatusText(quote.status)}</span></td>
                            <td>
                                ${quote.status === 'pending' ? 
                                    `<button class="btn-action btn-approve" onclick="simulateQuoteApproval('${quote.id}')">
                                        <i class="fas fa-check"></i> Simuler approbation
                                    </button>` : 
                                    quote.status === 'approved' ? 
                                    `<button class="btn-action btn-pay" onclick="processPayment('${quote.id}', ${quote.total_with_vat}, '${projectTypeNames[quote.project_type]} - ${quote.client_name}')">
                                        <i class="fas fa-credit-card"></i> Payer €${quote.total_with_vat}
                                    </button>` :
                                    quote.status === 'paid' ?
                                    `<span class="paid-indicator"><i class="fas fa-check-circle"></i> Payé</span>` :
                                    '-'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        ordersTableEl.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error displaying quotes history:', error);
        ordersTableEl.innerHTML = '<p class="no-orders">Erreur lors du chargement des devis</p>';
    }
}

function getStatusText(status) {
    const statusTexts = {
        'pending': 'En attente',
        'approved': 'Approuvé',
        'paid': 'Payé',
        'rejected': 'Refusé'
    };
    return statusTexts[status] || status;
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Add CSS for table and status badges
const additionalCSS = `
.orders-table-content {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
}

.orders-table-content th,
.orders-table-content td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.orders-table-content th {
    background: var(--bg-darker);
    color: var(--primary-color);
    font-weight: 600;
}

.orders-table-content td {
    color: var(--text-secondary);
}

.status-badge {
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
}

.status-pending {
    background: rgba(255, 193, 7, 0.2);
    color: #ffc107;
}

.status-approved {
    background: rgba(0, 123, 255, 0.2);
    color: #007bff;
}

.status-paid {
    background: rgba(0, 255, 136, 0.2);
    color: var(--primary-color);
}

.status-rejected {
    background: rgba(220, 53, 69, 0.2);
    color: #dc3545;
}

.btn-action {
    padding: 0.4rem 0.8rem;
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
}

.btn-approve {
    background: rgba(0, 123, 255, 0.2);
    color: #007bff;
    border: 1px solid #007bff;
}

.btn-approve:hover {
    background: #007bff;
    color: white;
}

.btn-pay {
    background: var(--gradient-primary);
    color: var(--bg-dark);
    font-weight: 600;
}

.btn-pay:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
}

.paid-indicator {
    color: var(--primary-color);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
}

.service-card.selected {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-neon);
    transform: translateY(-5px);
}

.service-card {
    cursor: pointer;
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// Homepage Functions
async function initializeHomepage() {
    await loadPortfolioItems();
    await loadReviews();
}

async function loadPortfolioItems() {
    const portfolioGrid = document.getElementById('portfolioGrid');
    if (!portfolioGrid) return;

    try {
        const { data: items, error } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        if (!items || items.length === 0) {
            portfolioGrid.innerHTML = `
                <div class="portfolio-empty">
                    <i class="fas fa-folder-open"></i>
                    <h3>Portfolio en construction</h3>
                    <p>Nos réalisations apparaîtront ici au fur et à mesure de nos projets.</p>
                </div>
            `;
            return;
        }

        portfolioGrid.innerHTML = items.map(item => `
            <div class="portfolio-item" data-aos="zoom-in">
                <div class="portfolio-image">
                    ${item.image_url ? 
                        `<img src="${item.image_url}" alt="${item.title}">` :
                        `<div class="portfolio-placeholder">
                            <i class="fas fa-code"></i>
                        </div>`
                    }
                </div>
                <div class="portfolio-content">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <div class="portfolio-tags">
                        ${item.tags.map(tag => `<span>${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading portfolio:', error);
        portfolioGrid.innerHTML = `
            <div class="portfolio-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger le portfolio pour le moment.</p>
            </div>
        `;
    }
}

async function loadReviews() {
    const reviewsGrid = document.getElementById('reviewsGrid');
    if (!reviewsGrid) return;

    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select(`
                *,
                user_profiles(name, server_name)
            `)
            .eq('is_approved', true)
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(6);

        if (error) throw error;

        if (!reviews || reviews.length === 0) {
            reviewsGrid.innerHTML = `
                <div class="testimonials-empty">
                    <i class="fas fa-comments"></i>
                    <h3>Vos avis nous intéressent</h3>
                    <p>Les avis de nos clients apparaîtront ici. Connectez-vous pour laisser le vôtre après un projet terminé.</p>
                    <a href="login.html" class="btn btn-primary">Se connecter</a>
                </div>
            `;
            return;
        }

        reviewsGrid.innerHTML = reviews.map((review, index) => `
            <div class="testimonial-card" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="testimonial-content">
                    <div class="stars">
                        ${Array.from({length: 5}, (_, i) => 
                            `<i class="fas fa-star${i < review.rating ? '' : ' star-empty'}"></i>`
                        ).join('')}
                    </div>
                    ${review.title ? `<h4>${review.title}</h4>` : ''}
                    <p>"${review.comment}"</p>
                </div>
                <div class="testimonial-author">
                    <div class="author-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="author-info">
                        <h4>${review.user_profiles.name}</h4>
                        <span>${review.user_profiles.server_name || 'Client FiveM Dev Pro'}</span>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsGrid.innerHTML = `
            <div class="testimonials-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les avis pour le moment.</p>
            </div>
        `;
    }
}