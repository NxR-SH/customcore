// Admin Dashboard System for FiveM Dev Pro
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.quotes = [];
        this.clients = [];
        this.invoices = [];
        this.init();
    }

    async init() {
        // Get current user and check admin role
        this.currentUser = await authSystem.getCurrentUser();
        
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            window.location.href = 'login.html';
            return;
        }

        // Load data
        await this.loadData();
        
        // Initialize UI
        this.initializeUI();
    }

    async loadData() {
        try {
            // Load all quotes
            const { data: quotes, error: quotesError } = await supabase
                .from('quotes')
                .select('*')
                .order('created_at', { ascending: false });

            if (quotesError) throw quotesError;
            this.quotes = quotes || [];
            
            // Load all clients
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'client');

            if (usersError) throw usersError;
            this.clients = users || [];
            
            // Load all invoices
            const { data: invoices, error: invoicesError } = await supabase
                .from('invoices')
                .select('*')
                .order('created_at', { ascending: false });

            if (invoicesError) throw invoicesError;
            this.invoices = invoices || [];

            // Load portfolio items
            await this.loadPortfolioItems();

            // Load reviews
            await this.loadReviews();

        } catch (error) {
            console.error('Error loading admin data:', error);
            this.quotes = [];
            this.clients = [];
            this.invoices = [];
        }
    }

    initializeUI() {
        // Update stats
        this.updateStats();
        
        // Display data
        this.displayQuotes();
        this.displayClients();
        this.displayInvoices();
        
        // Initialize filters
        this.initializeFilters();
    }

    updateStats() {
        // Total quotes
        document.getElementById('totalQuotes').textContent = this.quotes.length;
        
        // Total clients
        document.getElementById('totalClients').textContent = this.clients.length;
        
        // Total invoices
        document.getElementById('totalInvoices').textContent = this.invoices.length;
        
        // Total revenue
        const totalRevenue = this.invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);
        document.getElementById('totalRevenue').textContent = `€${totalRevenue.toFixed(2)}`;
    }

    displayQuotes(filter = 'all') {
        const container = document.getElementById('quotesTable');
        
        let filteredQuotes = this.quotes;
        if (filter !== 'all') {
            filteredQuotes = this.quotes.filter(quote => quote.status === filter);
        }

        if (filteredQuotes.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun devis trouvé</p>';
            return;
        }

        const projectTypeNames = {
            'creation': 'Création de script',
            'modification': 'Ajout de fonctionnalités',
            'debug': 'Correction/Optimisation',
            'systems': 'Systèmes métier/UI'
        };

        const tableHTML = `
            <table class="admin-table-content">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Client</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredQuotes.map(quote => `
                        <tr>
                            <td>${quote.id}</td>
                            <td>
                                <div class="client-info">
                                    <strong>${quote.client_name}</strong><br>
                                    <small>${quote.client_email}</small>
                                </div>
                            </td>
                            <td>${projectTypeNames[quote.project_type] || quote.project_type}</td>
                            <td>${new Date(quote.created_at).toLocaleDateString('fr-FR')}</td>
                            <td><span class="status-badge status-${quote.status}">${this.getStatusText(quote.status)}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-action btn-view" onclick="adminDashboard.viewQuote('${quote.id}')" title="Voir">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    ${quote.status === 'pending' ? 
                                        `<button class="btn-action btn-approve" onclick="adminDashboard.approveQuote('${quote.id}')" title="Approuver">
                                            <i class="fas fa-check"></i>
                                        </button>
                                        <button class="btn-action btn-reject" onclick="adminDashboard.rejectQuote('${quote.id}')" title="Refuser">
                                            <i class="fas fa-times"></i>
                                        </button>` : ''
                                    }
                                    ${quote.status === 'approved' ? 
                                        `<button class="btn-action btn-invoice" onclick="adminDashboard.createInvoiceFromQuote('${quote.id}')" title="Créer facture">
                                            <i class="fas fa-file-invoice"></i>
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

    displayClients() {
        const container = document.getElementById('clientsTable');
        
        if (this.clients.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun client trouvé</p>';
            return;
        }

        const tableHTML = `
            <table class="admin-table-content">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Serveur</th>
                        <th>Date d'inscription</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.clients.map(client => `
                        <tr>
                            <td>${client.name}</td>
                            <td>${client.email}</td>
                            <td>${client.server_name || '-'}</td>
                            <td>${new Date(client.created_at).toLocaleDateString('fr-FR')}</td>
                            <td><span class="status-badge status-${client.is_active ? 'active' : 'inactive'}">${client.is_active ? 'Actif' : 'Inactif'}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-action btn-edit" onclick="adminDashboard.editClient('${client.id}')" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-action ${client.is_active ? 'btn-deactivate' : 'btn-activate'}" 
                                            onclick="adminDashboard.toggleClientStatus('${client.id}')" 
                                            title="${client.is_active ? 'Désactiver' : 'Activer'}">
                                        <i class="fas fa-${client.is_active ? 'ban' : 'check'}"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
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
            <table class="admin-table-content">
                <thead>
                    <tr>
                        <th>Numéro</th>
                        <th>Client</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredInvoices.map(invoice => {
                        const client = this.clients.find(c => c.id === invoice.userId);
                        return `
                            <tr>
                                <td>${invoice.number}</td>
                                <td>
                                    <div class="client-info">
                                        <strong>${client ? client.name : 'Client supprimé'}</strong><br>
                                        <small>${client ? client.email : '-'}</small>
                                    </div>
                                </td>
                                <td>${invoice.description}</td>
                                <td>${new Date(invoice.created_at).toLocaleDateString('fr-FR')}</td>
                                <td>€${invoice.total.toFixed(2)}</td>
                                <td><span class="status-badge status-${invoice.status}">${this.getStatusText(invoice.status)}</span></td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-action btn-view" onclick="adminDashboard.viewInvoice('${invoice.id}')" title="Voir">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn-action btn-download" onclick="adminDashboard.downloadInvoice('${invoice.id}')" title="Télécharger">
                                            <i class="fas fa-download"></i>
                                        </button>
                                        ${invoice.status === 'pending' ? 
                                            `<button class="btn-action btn-send" onclick="adminDashboard.sendInvoice('${invoice.id}')" title="Envoyer">
                                                <i class="fas fa-paper-plane"></i>
                                            </button>` : ''
                                        }
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    initializeFilters() {
        // Quotes filter
        const quotesFilter = document.getElementById('quotesFilter');
        if (quotesFilter) {
            quotesFilter.addEventListener('change', (e) => {
                this.displayQuotes(e.target.value);
            });
        }

        // Invoices filter
        const invoicesFilter = document.getElementById('invoicesFilter');
        if (invoicesFilter) {
            invoicesFilter.addEventListener('change', (e) => {
                this.displayInvoices(e.target.value);
            });
        }
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': 'En attente',
            'approved': 'Approuvé',
            'paid': 'Payé',
            'rejected': 'Refusé',
            'overdue': 'En retard',
            'cancelled': 'Annulé',
            'active': 'Actif',
            'inactive': 'Inactif'
        };
        return statusTexts[status] || status;
    }

    viewQuote(quoteId) {
        const quote = this.quotes.find(q => q.id === quoteId);
        if (!quote) return;

        const projectTypeNames = {
            'creation': 'Création de script complet',
            'modification': 'Ajout de fonctionnalités',
            'debug': 'Correction de bugs / Optimisation',
            'systems': 'Systèmes métier, UI, interactions'
        };

        const modal = this.createModal('Détails du Devis', `
            <div class="quote-details">
                <div class="quote-info-grid">
                    <div class="quote-info-item">
                        <label>ID:</label>
                        <span>${quote.id}</span>
                    </div>
                    <div class="quote-info-item">
                        <label>Client:</label>
                        <span>${quote.client_name}</span>
                    </div>
                    <div class="quote-info-item">
                        <label>Email:</label>
                        <span>${quote.client_email}</span>
                    </div>
                    <div class="quote-info-item">
                        <label>Serveur:</label>
                        <span>${quote.server_name || '-'}</span>
                    </div>
                    <div class="quote-info-item">
                        <label>Type:</label>
                        <span>${projectTypeNames[quote.project_type]}</span>
                    </div>
                    <div class="quote-info-item">
                        <label>Framework:</label>
                        <span>${quote.framework.toUpperCase()}</span>
                    </div>
                    <div class="quote-info-item">
                        <label>Délai:</label>
                        <span>${quote.deadline}</span>
                    </div>
                    <div class="quote-info-item">
                        <label>Budget:</label>
                        <span>${quote.budget || 'Non spécifié'}</span>
                    </div>
                </div>
                <div class="quote-description">
                    <label>Description du projet:</label>
                    <div class="description-content">${quote.project_details}</div>
                </div>
                ${quote.estimated_hours ? `
                    <div class="quote-estimation">
                        <h4>Estimation approuvée:</h4>
                        <p><strong>Heures estimées:</strong> ${quote.estimated_hours}h</p>
                        <p><strong>Prix total:</strong> €${quote.total_with_vat}</p>
                    </div>
                ` : ''}
            </div>
        `, [
            {
                text: 'Fermer',
                class: 'btn-secondary',
                action: 'close'
            },
            ...(quote.status === 'pending' ? [
                {
                    text: 'Approuver',
                    class: 'btn-primary',
                    action: () => this.approveQuote(quoteId)
                },
                {
                    text: 'Refuser',
                    class: 'btn-danger',
                    action: () => this.rejectQuote(quoteId)
                }
            ] : [])
        ]);
    }

    async approveQuote(quoteId) {
        const quote = this.quotes.find(q => q.id === quoteId);
        if (!quote) return;

        // Show estimation modal
        const estimationModal = this.createModal('Approuver le Devis', `
            <div class="estimation-form">
                <div class="form-group">
                    <label for="estimatedHours">Heures estimées:</label>
                    <input type="number" id="estimatedHours" min="0.5" step="0.5" value="5" required>
                </div>
                <div class="form-group">
                    <label for="hourlyRate">Taux horaire (€):</label>
                    <input type="number" id="hourlyRate" min="1" value="25" required>
                </div>
                <div class="estimation-preview">
                    <p><strong>Sous-total:</strong> <span id="previewSubtotal">€125.00</span></p>
                    <p><strong>TVA (20%):</strong> <span id="previewVat">€25.00</span></p>
                    <p><strong>Total:</strong> <span id="previewTotal">€150.00</span></p>
                </div>
            </div>
        `, [
            {
                text: 'Annuler',
                class: 'btn-secondary',
                action: 'close'
            },
            {
                text: 'Approuver',
                class: 'btn-primary',
                action: async () => {
                    const hours = parseFloat(document.getElementById('estimatedHours').value);
                    const rate = parseFloat(document.getElementById('hourlyRate').value);
                    
                    if (hours && rate) {
                        const subtotal = hours * rate;
                        const vat = Math.round(subtotal * 0.2 * 100) / 100;
                        const total = subtotal + vat;
                        
                        try {
                            const { error } = await supabase
                                .from('quotes')
                                .update({
                                    status: 'approved',
                                    estimated_hours: hours,
                                    hourly_rate: rate,
                                    total_price: subtotal,
                                    vat: vat,
                                    total_with_vat: total,
                                    approved_at: new Date().toISOString()
                                })
                                .eq('id', quoteId);

                            if (error) throw error;

                            // Update local data
                            quote.status = 'approved';
                            quote.estimated_hours = hours;
                            quote.hourly_rate = rate;
                            quote.total_price = subtotal;
                            quote.vat = vat;
                            quote.total_with_vat = total;
                            quote.approved_at = new Date().toISOString();
                            
                            this.displayQuotes();
                            this.updateStats();
                            
                            estimationModal.remove();
                            alert('Devis approuvé avec succès !');
                        } catch (error) {
                            console.error('Error approving quote:', error);
                            alert('Erreur lors de l\'approbation du devis');
                        }
                    }
                }
            }
        ]);

        // Add real-time calculation
        const hoursInput = document.getElementById('estimatedHours');
        const rateInput = document.getElementById('hourlyRate');
        const updatePreview = () => {
            const hours = parseFloat(hoursInput.value) || 0;
            const rate = parseFloat(rateInput.value) || 0;
            const subtotal = hours * rate;
            const vat = Math.round(subtotal * 0.2 * 100) / 100;
            const total = subtotal + vat;
            
            document.getElementById('previewSubtotal').textContent = `€${subtotal.toFixed(2)}`;
            document.getElementById('previewVat').textContent = `€${vat.toFixed(2)}`;
            document.getElementById('previewTotal').textContent = `€${total.toFixed(2)}`;
        };
        
        hoursInput.addEventListener('input', updatePreview);
        rateInput.addEventListener('input', updatePreview);
    }

    async rejectQuote(quoteId) {
        const confirmed = confirm('Êtes-vous sûr de vouloir refuser ce devis ?');
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('quotes')
                .update({
                    status: 'rejected',
                    rejected_at: new Date().toISOString()
                })
                .eq('id', quoteId);

            if (error) throw error;

            // Update local data
            const quote = this.quotes.find(q => q.id === quoteId);
            if (quote) {
                quote.status = 'rejected';
                quote.rejected_at = new Date().toISOString();
            }
            
            this.displayQuotes();
            this.updateStats();
            
            alert('Devis refusé');
        } catch (error) {
            console.error('Error rejecting quote:', error);
            alert('Erreur lors du refus du devis');
        }
    }

    async createInvoiceFromQuote(quoteId) {
        const quote = this.quotes.find(q => q.id === quoteId);
        if (!quote || quote.status !== 'approved') return;

        const client = this.clients.find(c => c.email === quote.client_email);
        if (!client) {
            alert('Client non trouvé');
            return;
        }

        try {
            const invoiceData = {
                user_id: client.id,
                number: this.generateInvoiceNumber(),
                description: `${this.getProjectTypeName(quote.project_type)} - ${quote.client_name}`,
                items: [
                    {
                        description: this.getProjectTypeName(quote.project_type),
                        quantity: quote.estimated_hours,
                        unit_price: quote.hourly_rate
                    }
                ],
                subtotal: quote.total_price,
                vat: quote.vat,
                total: quote.total_with_vat,
                status: 'pending',
                quote_id: quoteId
            };

            const { data: invoice, error: invoiceError } = await supabase
                .from('invoices')
                .insert([invoiceData])
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            // Update quote status
            const { error: quoteError } = await supabase
                .from('quotes')
                .update({ status: 'invoiced' })
                .eq('id', quoteId);

            if (quoteError) throw quoteError;

            // Update local data
            this.invoices.push(invoice);
            quote.status = 'invoiced';

            this.displayInvoices();
            this.displayQuotes();
            this.updateStats();

            alert(`Facture ${invoice.number} créée avec succès !`);
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Erreur lors de la création de la facture');
        }
    }

    getProjectTypeName(type) {
        const names = {
            'creation': 'Création de script complet',
            'modification': 'Ajout de fonctionnalités',
            'debug': 'Correction de bugs / Optimisation',
            'systems': 'Systèmes métier, UI, interactions'
        };
        return names[type] || type;
    }

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const invoiceCount = this.invoices.length + 1;
        return `INV-${year}-${invoiceCount.toString().padStart(3, '0')}`;
    }

    createModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="this.closest('.admin-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${buttons.map(btn => `
                        <button class="btn ${btn.class}" onclick="${btn.action === 'close' ? 'this.closest(\'.admin-modal\').remove()' : `(${btn.action})()`}">
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    async toggleClientStatus(clientId) {
        const client = this.clients.find(c => c.id === clientId);
        if (!client) return;

        try {
            const newStatus = !client.is_active;
            
            const { error } = await supabase
                .from('users')
                .update({ is_active: newStatus })
                .eq('id', clientId);

            if (error) throw error;

            // Update local data
            client.is_active = newStatus;
            
            this.displayClients();
            alert(`Client ${newStatus ? 'activé' : 'désactivé'} avec succès`);
        } catch (error) {
            console.error('Error toggling client status:', error);
            alert('Erreur lors de la modification du statut du client');
        }
    }

    viewInvoice(invoiceId) {
        // Similar to client dashboard viewInvoice but with admin features
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const client = this.clients.find(c => c.id === invoice.userId);
        
        const modal = this.createModal(`Facture ${invoice.number}`, `
            <div class="invoice-details">
                <div class="invoice-info-grid">
                    <div class="invoice-info-item">
                        <label>Client:</label>
                        <span>${client ? client.name : 'Client supprimé'}</span>
                    </div>
                    <div class="invoice-info-item">
                        <label>Email:</label>
                        <span>${client ? client.email : '-'}</span>
                    </div>
                    <div class="invoice-info-item">
                        <label>Date:</label>
                        <span>${new Date(invoice.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div class="invoice-info-item">
                        <label>Statut:</label>
                        <span class="status-badge status-${invoice.status}">${this.getStatusText(invoice.status)}</span>
                    </div>
                </div>
                <div class="invoice-items">
                    <h4>Articles:</h4>
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
                                    <td>€${item.unit_price.toFixed(2)}</td>
                                    <td>€${(item.quantity * item.unit_price).toFixed(2)}</td>
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
        `, [
            {
                text: 'Fermer',
                class: 'btn-secondary',
                action: 'close'
            },
            {
                text: 'Télécharger PDF',
                class: 'btn-primary',
                action: () => this.downloadInvoice(invoiceId)
            }
        ]);
    }

    downloadInvoice(invoiceId) {
        // Similar to client dashboard but with admin branding
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const client = this.clients.find(c => c.id === invoice.userId);

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
        doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString('fr-FR')}`, 120, 60);
        doc.text(`Statut: ${this.getStatusText(invoice.status)}`, 120, 70);

        // Client info
        doc.setFontSize(14);
        doc.text('Facturé à:', 20, 100);
        doc.setFontSize(12);
        if (client) {
            doc.text(client.name, 20, 110);
            doc.text(client.email, 20, 120);
            if (client.server_name) {
                doc.text(`Serveur: ${client.server_name}`, 20, 130);
            }
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

    // Portfolio Management
    async loadPortfolioItems() {
        try {
            const { data: items, error } = await supabase
                .from('portfolio_items')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            this.portfolioItems = items || [];
            this.displayPortfolioItems();
        } catch (error) {
            console.error('Error loading portfolio items:', error);
            this.portfolioItems = [];
        }
    }

    displayPortfolioItems() {
        const container = document.getElementById('portfolioList');
        if (!container) return;

        if (this.portfolioItems.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun projet dans le portfolio</p>';
            return;
        }

        container.innerHTML = this.portfolioItems.map(item => `
            <div class="portfolio-item-admin">
                <div class="portfolio-item-header">
                    <h4>${item.title}</h4>
                    <div class="portfolio-item-actions">
                        <button class="btn-action btn-edit" onclick="adminDashboard.editPortfolioItem('${item.id}')" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action ${item.is_active ? 'btn-deactivate' : 'btn-activate'}" 
                                onclick="adminDashboard.togglePortfolioItem('${item.id}')" 
                                title="${item.is_active ? 'Désactiver' : 'Activer'}">
                            <i class="fas fa-${item.is_active ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="adminDashboard.deletePortfolioItem('${item.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p>${item.description}</p>
                <div class="portfolio-item-meta">
                    <span class="status-badge status-${item.is_active ? 'active' : 'inactive'}">
                        ${item.is_active ? 'Actif' : 'Inactif'}
                    </span>
                    <span>Ordre: ${item.display_order}</span>
                </div>
                <div class="tags-display">
                    ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `).join('');
    }

    async savePortfolioItem(itemData, itemId = null) {
        try {
            if (itemId) {
                // Update existing item
                const { error } = await supabase
                    .from('portfolio_items')
                    .update(itemData)
                    .eq('id', itemId);

                if (error) throw error;
            } else {
                // Create new item
                const { error } = await supabase
                    .from('portfolio_items')
                    .insert([itemData]);

                if (error) throw error;
            }

            await this.loadPortfolioItems();
            this.hidePortfolioForm();
            alert(itemId ? 'Projet modifié avec succès' : 'Projet ajouté avec succès');
        } catch (error) {
            console.error('Error saving portfolio item:', error);
            alert('Erreur lors de la sauvegarde du projet');
        }
    }

    async togglePortfolioItem(itemId) {
        try {
            const item = this.portfolioItems.find(i => i.id === itemId);
            if (!item) return;

            const { error } = await supabase
                .from('portfolio_items')
                .update({ is_active: !item.is_active })
                .eq('id', itemId);

            if (error) throw error;

            await this.loadPortfolioItems();
        } catch (error) {
            console.error('Error toggling portfolio item:', error);
            alert('Erreur lors de la modification du statut');
        }
    }

    async deletePortfolioItem(itemId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;

        try {
            const { error } = await supabase
                .from('portfolio_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            await this.loadPortfolioItems();
            alert('Projet supprimé avec succès');
        } catch (error) {
            console.error('Error deleting portfolio item:', error);
            alert('Erreur lors de la suppression du projet');
        }
    }

    // Reviews Management
    async loadReviews() {
        try {
            const { data: reviews, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    user_profiles!inner(name, server_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.reviews = reviews || [];
            this.displayReviews();
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.reviews = [];
        }
    }

    displayReviews(filter = 'all') {
        const container = document.getElementById('reviewsList');
        if (!container) return;

        let filteredReviews = this.reviews;
        if (filter !== 'all') {
            if (filter === 'pending') {
                filteredReviews = this.reviews.filter(r => !r.is_approved);
            } else if (filter === 'approved') {
                filteredReviews = this.reviews.filter(r => r.is_approved && !r.is_featured);
            } else if (filter === 'featured') {
                filteredReviews = this.reviews.filter(r => r.is_featured);
            }
        }

        if (filteredReviews.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun avis trouvé</p>';
            return;
        }

        container.innerHTML = filteredReviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-info">
                        <h4>${review.user_profiles.name}</h4>
                        <div class="review-rating">
                            ${Array.from({length: 5}, (_, i) => 
                                `<i class="fas fa-star${i < review.rating ? '' : ' star-empty'}"></i>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="review-status-container">
                        <span class="review-status ${review.is_featured ? 'featured' : review.is_approved ? 'approved' : 'pending'}">
                            ${review.is_featured ? 'Mis en avant' : review.is_approved ? 'Approuvé' : 'En attente'}
                        </span>
                    </div>
                </div>
                ${review.title ? `<h5>${review.title}</h5>` : ''}
                <p>${review.comment}</p>
                <small>Publié le ${new Date(review.created_at).toLocaleDateString('fr-FR')}</small>
                <div class="review-actions">
                    ${!review.is_approved ? 
                        `<button class="btn btn-primary btn-sm" onclick="adminDashboard.approveReview('${review.id}')">
                            Approuver
                        </button>` : ''
                    }
                    ${review.is_approved && !review.is_featured ? 
                        `<button class="btn btn-secondary btn-sm" onclick="adminDashboard.featureReview('${review.id}')">
                            Mettre en avant
                        </button>` : ''
                    }
                    ${review.is_featured ? 
                        `<button class="btn btn-secondary btn-sm" onclick="adminDashboard.unfeatureReview('${review.id}')">
                            Retirer de la mise en avant
                        </button>` : ''
                    }
                    <button class="btn btn-danger btn-sm" onclick="adminDashboard.deleteReview('${review.id}')">
                        Supprimer
                    </button>
                </div>
            </div>
        `).join('');
    }

    async approveReview(reviewId) {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ is_approved: true })
                .eq('id', reviewId);

            if (error) throw error;

            await this.loadReviews();
            alert('Avis approuvé avec succès');
        } catch (error) {
            console.error('Error approving review:', error);
            alert('Erreur lors de l\'approbation de l\'avis');
        }
    }

    async featureReview(reviewId) {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ is_featured: true })
                .eq('id', reviewId);

            if (error) throw error;

            await this.loadReviews();
            alert('Avis mis en avant avec succès');
        } catch (error) {
            console.error('Error featuring review:', error);
            alert('Erreur lors de la mise en avant de l\'avis');
        }
    }

    async unfeatureReview(reviewId) {
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ is_featured: false })
                .eq('id', reviewId);

            if (error) throw error;

            await this.loadReviews();
            alert('Avis retiré de la mise en avant');
        } catch (error) {
            console.error('Error unfeaturing review:', error);
            alert('Erreur lors du retrait de la mise en avant');
        }
    }

    async deleteReview(reviewId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;

        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;

            await this.loadReviews();
            alert('Avis supprimé avec succès');
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Erreur lors de la suppression de l\'avis');
        }
    }

    // UI Helper Methods
    showPortfolioForm() {
        document.getElementById('portfolioForm').style.display = 'block';
        document.getElementById('portfolioItemForm').reset();
    }

    hidePortfolioForm() {
        document.getElementById('portfolioForm').style.display = 'none';
    }

    editPortfolioItem(itemId) {
        const item = this.portfolioItems.find(i => i.id === itemId);
        if (!item) return;

        document.getElementById('portfolioTitle').value = item.title;
        document.getElementById('portfolioImageUrl').value = item.image_url || '';
        document.getElementById('portfolioDescription').value = item.description;
        document.getElementById('portfolioTags').value = item.tags.join(', ');
        document.getElementById('portfolioTechnologies').value = item.technologies.join(', ');
        document.getElementById('portfolioOrder').value = item.display_order;

        document.getElementById('portfolioForm').style.display = 'block';
        document.getElementById('portfolioItemForm').dataset.editId = itemId;
    }
}

// Initialize admin dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', function() {
    adminDashboard = new AdminDashboard();
    window.adminDashboard = adminDashboard;

    // Initialize portfolio form
    const portfolioForm = document.getElementById('portfolioItemForm');
    if (portfolioForm) {
        portfolioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                title: document.getElementById('portfolioTitle').value,
                image_url: document.getElementById('portfolioImageUrl').value || null,
                description: document.getElementById('portfolioDescription').value,
                tags: document.getElementById('portfolioTags').value.split(',').map(t => t.trim()).filter(t => t),
                technologies: document.getElementById('portfolioTechnologies').value.split(',').map(t => t.trim()).filter(t => t),
                display_order: parseInt(document.getElementById('portfolioOrder').value) || 0
            };

            const editId = portfolioForm.dataset.editId;
            await adminDashboard.savePortfolioItem(formData, editId || null);
            delete portfolioForm.dataset.editId;
        });
    }

    // Initialize reviews filter
    const reviewsFilter = document.getElementById('reviewsFilter');
    if (reviewsFilter) {
        reviewsFilter.addEventListener('change', (e) => {
            adminDashboard.displayReviews(e.target.value);
        });
    }
});

// Global functions
function showPortfolioForm() {
    if (window.adminDashboard) {
        window.adminDashboard.showPortfolioForm();
    }
}

function hidePortfolioForm() {
    if (window.adminDashboard) {
        window.adminDashboard.hidePortfolioForm();
    }
}