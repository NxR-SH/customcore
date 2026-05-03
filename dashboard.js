// Dashboard System for FiveM Dev Pro
class ClientDashboard {
    constructor() {
        this.currentUser = null;
        this.invoices = [];
        this.subscriptions = [];
        this.stripe = null;
        this.init();
    }

    async init() {
        // Get current user
        this.currentUser = await authSystem.getCurrentUser();
        
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // Initialize Stripe
        if (typeof Stripe !== 'undefined') {
            this.stripe = Stripe('pk_test_51234567890abcdef'); // Use your Stripe key
        }

        // Load data
        await this.loadUserData();
        
        // Initialize UI
        this.initializeUI();
        
        // Initialize review form
        this.initializeReviewForm();
    }

    async loadUserData() {
        try {
            // Load user's invoices
            const { data: invoices, error: invoicesError } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', this.currentUser.id);

            if (invoicesError) throw invoicesError;
            this.invoices = invoices || [];

            // Load user's subscriptions
            const { data: subscriptions, error: subscriptionsError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', this.currentUser.id);

            if (subscriptionsError) throw subscriptionsError;
            this.subscriptions = subscriptions || [];

            // Load user's reviews
            await this.loadUserReviews();

        } catch (error) {
            console.error('Error loading user data:', error);
            this.invoices = [];
            this.subscriptions = [];
        }
    }

    initializeUI() {
        // Update stats
        this.updateStats();
        
        // Display invoices
        this.displayInvoices();
        
        // Display subscriptions
        this.displaySubscriptions();
        
        // Initialize filters
        this.initializeFilters();
    }

    updateStats() {
        // Total invoices
        document.getElementById('totalInvoices').textContent = this.invoices.length;
        
        // Pending invoices
        const pendingInvoices = this.invoices.filter(inv => inv.status === 'pending').length;
        document.getElementById('pendingInvoices').textContent = pendingInvoices;
        
        // Active subscriptions
        const activeSubscriptions = this.subscriptions.filter(sub => sub.status === 'active').length;
        document.getElementById('activeSubscriptions').textContent = activeSubscriptions;
        
        // Total spent
        const totalSpent = this.invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);
        document.getElementById('totalSpent').textContent = `€${totalSpent.toFixed(2)}`;
    }

    displayInvoices(filter = 'all') {
        const container = document.getElementById('invoicesTable');
        
        let filteredInvoices = this.invoices;
        if (filter !== 'all') {
            filteredInvoices = this.invoices.filter(inv => inv.status === filter);
        }

        if (filteredInvoices.length === 0) {
            container.innerHTML = '<p class="no-data">Aucune facture trouvée</p>';
            return;
        }

        const tableHTML = `
            <table class="data-table-content">
                <thead>
                    <tr>
                        <th>Facture</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredInvoices.map(invoice => `
                        <tr>
                            <td>${invoice.number}</td>
                            <td>${new Date(invoice.date).toLocaleDateString('fr-FR')}</td>
                            <td>${invoice.description}</td>
                            <td>€${invoice.total.toFixed(2)}</td>
                            <td><span class="status-badge status-${invoice.status}">${this.getStatusText(invoice.status)}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-action btn-view" onclick="clientDashboard.viewInvoice('${invoice.id}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-action btn-download" onclick="clientDashboard.downloadInvoice('${invoice.id}')">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    ${invoice.status === 'pending' ? 
                                        `<button class="btn-action btn-pay" onclick="clientDashboard.payInvoice('${invoice.id}')">
                                            <i class="fas fa-credit-card"></i>
                                        </button>` : ''
                                    }
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    displaySubscriptions() {
        const container = document.getElementById('subscriptionsGrid');
        
        if (this.subscriptions.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun abonnement actif</p>';
            return;
        }

        const subscriptionsHTML = this.subscriptions.map(sub => `
            <div class="subscription-card">
                <div class="subscription-header">
                    <h3>${sub.name}</h3>
                    <span class="subscription-status status-${sub.status}">${this.getStatusText(sub.status)}</span>
                </div>
                <div class="subscription-details">
                    <p class="subscription-price">€${sub.price}/mois</p>
                    <p class="subscription-description">${sub.description}</p>
                    <p class="subscription-next-billing">
                        Prochaine facturation: ${new Date(sub.next_billing).toLocaleDateString('fr-FR')}
                    </p>
                </div>
                <div class="subscription-actions">
                    ${sub.status === 'active' ? 
                        `<button class="btn btn-secondary" onclick="clientDashboard.cancelSubscription('${sub.id}')">
                            Annuler
                        </button>` :
                        `<button class="btn btn-primary" onclick="clientDashboard.reactivateSubscription('${sub.id}')">
                            Réactiver
                        </button>`
                    }
                </div>
            </div>
        `).join('');

        container.innerHTML = subscriptionsHTML;
    }

    initializeFilters() {
        const filterSelect = document.getElementById('invoiceFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.displayInvoices(e.target.value);
            });
        }
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': 'En attente',
            'paid': 'Payée',
            'overdue': 'En retard',
            'cancelled': 'Annulée',
            'active': 'Actif',
            'inactive': 'Inactif'
        };
        return statusTexts[status] || status;
    }

    async payInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice || !this.stripe) {
            alert('Erreur lors du paiement');
            return;
        }

        try {
            const { error } = await this.stripe.redirectToCheckout({
                lineItems: [{
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: invoice.description,
                            description: `Facture ${invoice.number}`,
                        },
                        unit_amount: Math.round(invoice.total * 100),
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                successUrl: `${window.location.origin}/success.html?invoice=${invoiceId}`,
                cancelUrl: `${window.location.origin}/dashboard.html`,
                metadata: {
                    invoiceId: invoiceId,
                    userId: this.currentUser.id,
                    type: 'invoice_payment'
                }
            });

            if (error) {
                console.error('Stripe error:', error);
                alert('Erreur lors de la redirection vers le paiement');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Erreur lors du paiement');
        }
    }

    viewInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        // Create modal to display invoice details
        const modal = document.createElement('div');
        modal.className = 'invoice-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Facture ${invoice.number}</h2>
                    <button class="modal-close" onclick="this.closest('.invoice-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="invoice-details">
                        <div class="invoice-info">
                            <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Statut:</strong> <span class="status-badge status-${invoice.status}">${this.getStatusText(invoice.status)}</span></p>
                            <p><strong>Description:</strong> ${invoice.description}</p>
                        </div>
                        <div class="invoice-items">
                            <h3>Détails</h3>
                            <table class="invoice-items-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Quantité</th>
                                        <th>Prix unitaire</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${invoice.items.map(item => `
                                        <tr>
                                            <td>${item.description}</td>
                                            <td>${item.quantity}</td>
                                            <td>€${item.unitPrice.toFixed(2)}</td>
                                            <td>€${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="invoice-totals">
                            <p><strong>Sous-total: €${invoice.subtotal.toFixed(2)}</strong></p>
                            <p><strong>TVA (20%): €${invoice.vat.toFixed(2)}</strong></p>
                            <p class="total-amount"><strong>Total: €${invoice.total.toFixed(2)}</strong></p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.invoice-modal').remove()">Fermer</button>
                    <button class="btn btn-primary" onclick="clientDashboard.downloadInvoice('${invoice.id}')">Télécharger PDF</button>
                    ${invoice.status === 'pending' ? 
                        `<button class="btn btn-primary" onclick="clientDashboard.payInvoice('${invoice.id}')">Payer maintenant</button>` : ''
                    }
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    downloadInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        // Generate PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

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
        doc.text(`Facture N°: ${invoice.number}`, 120, 50);
        doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, 120, 60);
        doc.text(`Statut: ${this.getStatusText(invoice.status)}`, 120, 70);

        // Client info
        doc.setFontSize(14);
        doc.text('Facturé à:', 20, 100);
        doc.setFontSize(12);
        doc.text(this.currentUser.name, 20, 110);
        doc.text(this.currentUser.email, 20, 120);
        if (this.currentUser.serverName) {
            doc.text(`Serveur: ${this.currentUser.serverName}`, 20, 130);
        }

        // Items table
        let yPos = 160;
        doc.setFontSize(14);
        doc.text('Services:', 20, yPos);
        
        yPos += 15;
        doc.setFontSize(10);
        doc.text('Description', 20, yPos);
        doc.text('Qté', 100, yPos);
        doc.text('Prix unitaire', 130, yPos);
        doc.text('Total', 170, yPos);
        
        doc.line(20, yPos + 3, 190, yPos + 3);
        yPos += 10;

        invoice.items.forEach(item => {
            doc.text(item.description, 20, yPos);
            doc.text(item.quantity.toString(), 100, yPos);
            doc.text(`€${item.unit_price.toFixed(2)}`, 130, yPos);
            doc.text(`€${(item.quantity * item.unit_price).toFixed(2)}`, 170, yPos);
            yPos += 10;
        });

        // Totals
        yPos += 10;
        doc.line(20, yPos, 190, yPos);
        yPos += 15;
        doc.text(`Sous-total: €${invoice.subtotal.toFixed(2)}`, 130, yPos);
        yPos += 10;
        doc.text(`TVA (20%): €${invoice.vat.toFixed(2)}`, 130, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`TOTAL: €${invoice.total.toFixed(2)}`, 130, yPos);

        // Footer
        yPos += 20;
        doc.setFontSize(10);
        doc.text('Merci pour votre confiance !', 20, yPos);

        // Download
        doc.save(`Facture_${invoice.number}.pdf`);
    }

    initializeReviewForm() {
        const ratingStars = document.querySelectorAll('#ratingInput .star');
        let selectedRating = 0;

        ratingStars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                this.updateStarDisplay(selectedRating);
            });

            star.addEventListener('mouseover', () => {
                const hoverRating = parseInt(star.dataset.rating);
                this.updateStarDisplay(hoverRating);
            });
        });

        document.getElementById('ratingInput').addEventListener('mouseleave', () => {
            this.updateStarDisplay(selectedRating);
        });

        document.getElementById('newReviewForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitReview(selectedRating);
        });
    }

    updateStarDisplay(rating) {
        const stars = document.querySelectorAll('#ratingInput .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    async submitReview(rating) {
        if (rating === 0) {
            alert('Veuillez sélectionner une note');
            return;
        }

        const title = document.getElementById('reviewTitle').value;
        const comment = document.getElementById('reviewComment').value;

        if (!comment.trim()) {
            alert('Veuillez saisir un commentaire');
            return;
        }

        try {
            const { error } = await supabase
                .from('reviews')
                .insert([{
                    user_id: this.currentUser.id,
                    rating: rating,
                    title: title || null,
                    comment: comment.trim()
                }]);

            if (error) throw error;

            alert('Votre avis a été soumis et sera examiné avant publication. Merci !');
            this.hideReviewForm();
            await this.loadUserReviews();

        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Erreur lors de la soumission de l\'avis');
        }
    }

    async loadUserReviews() {
        const container = document.getElementById('userReviews');
        if (!container) return;

        try {
            const { data: reviews, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!reviews || reviews.length === 0) {
                container.innerHTML = '<p class="no-data">Vous n\'avez pas encore laissé d\'avis</p>';
                return;
            }

            container.innerHTML = reviews.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="review-rating">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="fas fa-star${i < review.rating ? '' : ' star-empty'}"></i>`
                            ).join('')}
                        </div>
                        <span class="review-status ${review.is_approved ? 'approved' : 'pending'}">
                            ${review.is_approved ? 'Publié' : 'En attente'}
                        </span>
                    </div>
                    ${review.title ? `<h4>${review.title}</h4>` : ''}
                    <p>${review.comment}</p>
                    <small>Publié le ${new Date(review.created_at).toLocaleDateString('fr-FR')}</small>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading user reviews:', error);
            container.innerHTML = '<p class="no-data">Erreur lors du chargement des avis</p>';
        }
    }

    showReviewForm() {
        document.getElementById('reviewForm').style.display = 'block';
        document.getElementById('reviewTitle').value = '';
        document.getElementById('reviewComment').value = '';
        this.updateStarDisplay(0);
    }

    hideReviewForm() {
        document.getElementById('reviewForm').style.display = 'none';
    }

    async cancelSubscription(subscriptionId) {
        const confirmed = confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?');
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('subscriptions')
                .update({ 
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString()
                })
                .eq('id', subscriptionId)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            // Update local data
            const subscription = this.subscriptions.find(sub => sub.id === subscriptionId);
            if (subscription) {
                subscription.status = 'cancelled';
                subscription.cancelled_at = new Date().toISOString();
            }
            
            this.displaySubscriptions();
            this.updateStats();
            
            alert('Abonnement annulé avec succès');
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert('Erreur lors de l\'annulation de l\'abonnement');
        }
    }

    async reactivateSubscription(subscriptionId) {
        try {
            const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            
            const { error } = await supabase
                .from('subscriptions')
                .update({ 
                    status: 'active',
                    next_billing: nextBilling
                })
                .eq('id', subscriptionId)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;

            // Update local data
            const subscription = this.subscriptions.find(sub => sub.id === subscriptionId);
            if (subscription) {
                subscription.status = 'active';
                subscription.next_billing = nextBilling;
            }
            
            this.displaySubscriptions();
            this.updateStats();
            
            alert('Abonnement réactivé avec succès');
        } catch (error) {
            console.error('Error reactivating subscription:', error);
            alert('Erreur lors de la réactivation de l\'abonnement');
        }
    }

}

// Initialize dashboard
let clientDashboard;
document.addEventListener('DOMContentLoaded', function() {
    clientDashboard = new ClientDashboard();
    window.clientDashboard = clientDashboard;
});

// Global functions for review form
function showReviewForm() {
    if (window.clientDashboard) {
        window.clientDashboard.showReviewForm();
    }
}

function hideReviewForm() {
    if (window.clientDashboard) {
        window.clientDashboard.hideReviewForm();
    }
}