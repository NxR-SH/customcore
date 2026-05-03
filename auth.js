// Authentication System for FiveM Dev Pro
// Utilise supabase global (chargé via CDN dans supabase-config.js)

class AuthSystem {
    constructor() {
        this.currentUser = null
        this.init()
    }

    async init() {
        // Vérifier la session actuelle
        await this.checkAuthStatus()
        // Initialiser les formulaires si présents
        this.initializeForms()
        // Protéger les pages sensibles
        this.protectPages()
        // Messages URL
        this.checkUrlMessages()
    }

    async checkAuthStatus() {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                this.currentUser = session.user
                this.updateUserInterface()
            }
        } catch (e) {
            console.error('checkAuthStatus error:', e)
        }
    }

    checkUrlMessages() {
        const params = new URLSearchParams(window.location.search)
        if (params.get('message') === 'password-updated') {
            this.showSuccess('Mot de passe mis à jour ! Vous pouvez vous connecter.')
            window.history.replaceState({}, document.title, window.location.pathname)
        }
    }

    initializeForms() {
        const loginForm = document.getElementById('loginForm')
        if (loginForm) loginForm.addEventListener('submit', e => this.handleLogin(e))

        const registerForm = document.getElementById('registerForm')
        if (registerForm) registerForm.addEventListener('submit', e => this.handleRegister(e))
    }

    protectPages() {
        const path = window.location.pathname
        // dashboard.html nécessite d'être connecté
        if (path.includes('dashboard.html') && !this.currentUser) {
            window.location.href = 'login.html'
        }
        // admin.html est protégé par admin.js directement (vérification rôle)
    }

    async handleLogin(e) {
        e.preventDefault()
        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value
        if (!email || !password) return this.showError('Veuillez remplir tous les champs')

        const btn = e.target.querySelector('button[type="submit"]')
        const orig = btn.innerHTML
        btn.disabled = true
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...'

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error

            this.currentUser = data.user
            this.showSuccess('Connexion réussie !')

            // Vérifier le rôle pour redirection
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            setTimeout(() => {
                window.location.href = (profile?.role === 'admin') ? 'admin.html' : 'dashboard.html'
            }, 800)
        } catch (error) {
            this.showError('Email ou mot de passe incorrect')
        } finally {
            btn.disabled = false
            btn.innerHTML = orig
        }
    }

    async handleRegister(e) {
        e.preventDefault()
        const name = document.getElementById('regName').value.trim()
        const email = document.getElementById('regEmail').value.trim()
        const password = document.getElementById('regPassword').value
        const confirmPassword = document.getElementById('regConfirmPassword').value
        const serverName = document.getElementById('serverName')?.value.trim() || ''

        if (!name || !email || !password) return this.showError('Veuillez remplir tous les champs')
        if (password !== confirmPassword) return this.showError('Les mots de passe ne correspondent pas')
        if (password.length < 6) return this.showError('Mot de passe trop court (6 caractères minimum)')

        const btn = e.target.querySelector('button[type="submit"]')
        const orig = btn.innerHTML
        btn.disabled = true
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...'

        try {
            const { data, error } = await supabase.auth.signUp({ email, password })
            if (error) throw error

            // Créer le profil
            if (data.user) {
                await supabase.from('user_profiles').insert([{
                    id: data.user.id,
                    email,
                    name,
                    server_name: serverName || null,
                    role: 'client',
                    is_active: true
                }])
            }

            this.showSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.')
            e.target.reset()
        } catch (error) {
            this.showError(error.message || 'Erreur lors de la création du compte')
        } finally {
            btn.disabled = false
            btn.innerHTML = orig
        }
    }

    async handleForgotPassword(email) {
        if (!email) return this.showError('Veuillez saisir votre email')
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            })
            if (error) throw error
            this.showSuccess('Email de réinitialisation envoyé !')
        } catch (error) {
            this.showError('Erreur lors de l\'envoi de l\'email')
        }
    }

    updateUserInterface() {
        const userNameEl = document.getElementById('userName')
        if (userNameEl && this.currentUser) {
            userNameEl.textContent = this.currentUser.user_metadata?.name || this.currentUser.email
        }
        this.updateNavigation()
    }

    updateNavigation() {
        const navMenu = document.querySelector('.nav-menu')
        if (!navMenu) return

        navMenu.querySelectorAll('.auth-link').forEach(l => l.remove())

        if (this.currentUser) {
            const dashLink = document.createElement('li')
            dashLink.innerHTML = `<a href="dashboard.html" class="nav-link auth-link">Dashboard</a>`
            navMenu.appendChild(dashLink)

            const logoutLink = document.createElement('li')
            logoutLink.innerHTML = `<a href="#" onclick="authSystem.logout()" class="nav-link auth-link" style="color:#dc3545;">Déconnexion</a>`
            navMenu.appendChild(logoutLink)
        } else {
            const loginLink = document.createElement('li')
            loginLink.innerHTML = `<a href="login.html" class="nav-link auth-link">Connexion</a>`
            navMenu.appendChild(loginLink)
        }
    }

    async logout() {
        await supabase.auth.signOut()
        this.currentUser = null
        window.location.href = 'index.html'
    }

    async getCurrentUser() {
        const { data: { session } } = await supabase.auth.getSession()
        return session?.user || null
    }

    showError(msg) { this.showMessage(msg, 'error') }
    showSuccess(msg) { this.showMessage(msg, 'success') }

    showMessage(message, type) {
        document.querySelectorAll('.auth-message').forEach(m => m.remove())
        const el = document.createElement('div')
        el.className = `auth-message auth-message-${type}`
        el.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> <span>${message}</span>`
        const container = document.querySelector('.auth-form-container') || document.body
        container.insertBefore(el, container.firstChild)
        setTimeout(() => el.remove(), 5000)
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }
}

// Init
let authSystem
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem()
    window.authSystem = authSystem
})

// Fonctions globales
function logout() {
    authSystem?.logout()
}
