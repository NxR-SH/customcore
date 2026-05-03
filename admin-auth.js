// Admin Authentication Middleware
class AdminAuth {
    static async checkAdminAccess() {
        try {
            // Check if user is logged in
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                throw new Error('Utilisateur non connecté');
            }

            // Check user profile and admin role
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) {
                throw new Error('Profil utilisateur non trouvé');
            }

            if (profile.role !== 'admin') {
                throw new Error('Droits d\'administrateur requis');
            }

            return { user, profile };
        } catch (error) {
            console.error('Admin access check failed:', error);
            throw error;
        }
    }

    static redirectToAccessDenied(message = 'Accès refusé') {
        // Store the error message in sessionStorage for display
        sessionStorage.setItem('accessDeniedMessage', message);
        window.location.href = 'access-denied.html';
    }

    static redirectToLogin(message = 'Vous devez être connecté') {
        alert(message);
        window.location.href = 'login.html';
    }

    static async protectAdminPage() {
        try {
            const result = await AdminAuth.checkAdminAccess();
            return result;
        } catch (error) {
            if (error.message.includes('non connecté')) {
                AdminAuth.redirectToLogin(error.message);
            } else {
                AdminAuth.redirectToAccessDenied(error.message);
            }
            return null;
        }
    }
}

// Auto-protect admin pages
document.addEventListener('DOMContentLoaded', function() {
    // Check if this is an admin page
    const isAdminPage = window.location.pathname.includes('admin.html') || 
                       document.body.classList.contains('admin-page') ||
                       document.getElementById('adminDashboard');
    
    if (isAdminPage) {
        AdminAuth.protectAdminPage();
    }
});

// Export for use in other files
window.AdminAuth = AdminAuth;