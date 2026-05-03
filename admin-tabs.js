// Admin tabs functionality
function showTab(tabName) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(tabName);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    const activeTab = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

// Initialize tabs on page load
document.addEventListener('DOMContentLoaded', function() {
    // Show quotes tab by default
    showTab('quotes');
});