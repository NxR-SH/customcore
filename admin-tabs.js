// Gestion des onglets admin
function showTab(tabName) {
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(tabName);
    if (target) target.style.display = 'block';

    const btn = document.querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`);
    if (btn) btn.classList.add('active');
}

function showPortfolioForm() {
    document.getElementById('portfolioForm').style.display = 'block';
    document.getElementById('portfolioItemForm').reset();
    delete document.getElementById('portfolioItemForm').dataset.editId;
}

function hidePortfolioForm() {
    document.getElementById('portfolioForm').style.display = 'none';
}

function logout() {
    if (window.authSystem) authSystem.logout();
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialiser les filtres
    const quotesFilter = document.getElementById('quotesFilter');
    if (quotesFilter) {
        quotesFilter.addEventListener('change', e => {
            if (window.adminDashboard) adminDashboard.displayQuotes(e.target.value);
        });
    }

    const invoicesFilter = document.getElementById('invoicesFilter');
    if (invoicesFilter) {
        invoicesFilter.addEventListener('change', e => {
            if (window.adminDashboard) adminDashboard.displayInvoices(e.target.value);
        });
    }

    const reviewsFilter = document.getElementById('reviewsFilter');
    if (reviewsFilter) {
        reviewsFilter.addEventListener('change', e => {
            if (window.adminDashboard) adminDashboard.displayReviews(e.target.value);
        });
    }

    // Formulaire portfolio
    const portfolioForm = document.getElementById('portfolioItemForm');
    if (portfolioForm) {
        portfolioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                title: document.getElementById('portfolioTitle').value,
                image_url: document.getElementById('portfolioImageUrl').value || null,
                description: document.getElementById('portfolioDescription').value,
                tags: document.getElementById('portfolioTags').value.split(',').map(t => t.trim()).filter(Boolean),
                technologies: document.getElementById('portfolioTechnologies').value.split(',').map(t => t.trim()).filter(Boolean),
                display_order: parseInt(document.getElementById('portfolioOrder').value) || 0
            };
            const editId = portfolioForm.dataset.editId || null;
            if (window.adminDashboard) await adminDashboard.savePortfolioItem(formData, editId);
        });
    }
});
