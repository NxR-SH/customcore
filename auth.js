// Authentication System for FiveM Dev Pro with Supabase
import supabaseService from './supabase-config.js'

class AuthSystem {
    constructor() {
        this.currentUser = null
        this.init()
    }

    async init() {
        // Attendre que Supabase soit initialisé
        await this.waitForSupabase()
        
        // Vérifier le statut d'authentification
        await this.checkAuthStatus()
        
        // Initialiser les formulaires
        this.initializeForms()
        
        // Protéger les pages dashboard
        this.protectDashboard()
        
        // Vérifier les messages dans l'URL
        this.checkUrlMessages()
    }

    async waitForSupabase() {
        // Attendre que supabaseService soit disponible
        while (!window.supabaseService) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }

    async checkAuthStatus() {
        if (supabaseService.isAuthenticated()) {
            this.currentUser = supabaseService.getCurrentUser()
            this.updateUserInterface()
        }
    }

    checkUrlMessages() {
        const urlParams = new URLSearchParams(window.location.search)
        const message = urlParams.get('message')
        
        if (message === 'password-updated') {
            this.showSuccess('Mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter.')
            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname)
        }
    }

    initializeForms() {
        // Formulaire de connexion
        const loginForm = document.getElementById('loginForm')
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e))
        }

        // Formulaire d'inscription
        const registerForm = document.getElementById('registerForm')
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e))
        }
    }

    protectDashboard() {
        // Protéger les pages dashboard
        if (window.location.pathname.includes('dashboard.html') || 
            window.location.pathname.includes('admin.html')) {
            if (!supabaseService.isAuthenticated()) {
                window.location.href = 'login.html'
                return
            }
            
            // Vérifier les permissions admin
            if (window.location.pathname.includes('admin.html') && !supabaseService.isAdmin()) {
                window.location.href = 'dashboard.html'
                return
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault()
        
        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value

        // Validation
        if (!email || !password) {
            this.showError('Veuillez remplir tous les champs')
            return
        }

        if (!this.isValidEmail(email)) {
            this.showError('Veuillez saisir un email valide')
            return
        }

        // Désactiver le bouton pendant le traitement
        const submitBtn = e.target.querySelector('button[type="submit"]')
        const originalText = submitBtn.innerHTML
        submitBtn.disabled = true
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...'

        try {
            const result = await supabaseService.signIn(email, password)
            
            if (result.success) {
                this.currentUser = result.data.user
                this.showSuccess('Connexion réussie !')
                
                // Redirection selon le rôle
                setTimeout(() => {
                    if (supabaseService.isAdmin()) {
                        window.location.href = 'admin.html'
                    } else {
                        window.location.href = 'dashboard.html'
                    }
                }, 1000)
            } else {
                this.showError(result.error || 'Email ou mot de passe incorrect')
            }
        } catch (error) {
            console.error('Erreur de connexion:', error)
            this.showError('Erreur de connexion. Veuillez réessayer.')
        } finally {
            submitBtn.disabled = false
            submitBtn.innerHTML = originalText
        }
    }

    async handleRegister(e) {
        e.preventDefault()
        
        const name = document.getElementById('regName').value.trim()
        const email = document.getElementById('regEmail').value.trim()
        const password = document.getElementById('regPassword').value
        const confirmPassword = document.getElementById('regConfirmPassword').value
        const serverName = document.getElementById('serverName').value.trim()

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showError('Veuillez remplir tous les champs obligatoires')
            return
        }

        if (!this.isValidEmail(email)) {
            this.showError('Veuillez saisir un email valide')
            return
        }

        if (password !== confirmPassword) {
            this.showError('Les mots de passe ne correspondent pas')
            return
        }

        if (password.length < 6) {
            this.showError('Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        // Désactiver le bouton pendant le traitement
        const submitBtn = e.target.querySelector('button[type="submit"]')
        const originalText = submitBtn.innerHTML
        submitBtn.disabled = true
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...'

        try {
            const result = await supabaseService.signUp(email, password, {
                name,
                serverName
            })
            
            if (result.success) {
                this.showSuccess('Compte créé avec succès ! Vérifiez votre email pour confirmer votre inscription.')
                
                // Réinitialiser le formulaire
                e.target.reset()
            } else {
                this.showError(result.error || 'Erreur lors de la création du compte')
            }
        } catch (error) {
            console.error('Erreur d\'inscription:', error)
            this.showError('Erreur lors de la création du compte')
        } finally {
            submitBtn.disabled = false
            submitBtn.innerHTML = originalText
        }
    }

    async handleForgotPassword(email) {
        if (!email) {
            this.showError('Veuillez saisir votre email')
            return
        }

        if (!this.isValidEmail(email)) {
            this.showError('Veuillez saisir un email valide')
            return
        }

        try {
            const result = await supabaseService.resetPassword(email)
            
            if (result.success) {
                this.showSuccess('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.')
            } else {
                this.showError(result.error || 'Erreur lors de l\'envoi de l\'email')
            }
        } catch (error) {
            console.error('Erreur reset password:', error)
            this.showError('Erreur lors de l\'envoi de l\'email')
        }
    }

    updateUserInterface() {
        // Mettre à jour le nom d'utilisateur dans le dashboard
        const userNameEl = document.getElementById('userName')
        if (userNameEl && this.currentUser) {
            const profile = supabaseService.getUserProfile()
            userNameEl.textContent = profile?.name || this.currentUser.email
        }

        // Mettre à jour la navigation
        this.updateNavigation()
    }

    updateNavigation() {
        // Ajouter les liens de connexion/déconnexion à la navigation
        const navMenu = document.querySelector('.nav-menu')
        if (!navMenu) return

        // Supprimer les liens d'authentification existants
        const existingAuthLinks = navMenu.querySelectorAll('.auth-link')
        existingAuthLinks.forEach(link => link.remove())

        if (supabaseService.isAuthenticated()) {
            // Ajouter les liens pour utilisateur connecté
            const dashboardLink = document.createElement('li')
            dashboardLink.innerHTML = `<a href="dashboard.html" class="nav-link auth-link">Dashboard</a>`
            
            // Ajouter le lien admin si l'utilisateur est admin
            if (supabaseService.isAdmin()) {
                const adminLink = document.createElement('li')
                adminLink.innerHTML = `<a href="admin.html" class="nav-link auth-link">Admin</a>`
                navMenu.appendChild(adminLink)
            }
            
            const logoutLink = document.createElement('li')
            logoutLink.innerHTML = `<a href="#" onclick="authSystem.logout()" class="nav-link auth-link">Déconnexion</a>`
            
            navMenu.appendChild(dashboardLink)
            navMenu.appendChild(logoutLink)
        } else {
            // Ajouter le lien de connexion
            const loginLink = document.createElement('li')
            loginLink.innerHTML = `<a href="login.html" class="nav-link auth-link">Connexion</a>`
            navMenu.appendChild(loginLink)
        }
    }

    async logout() {
        try {
            const result = await supabaseService.signOut()
            
            if (result.success) {
                this.currentUser = null
                this.showSuccess('Déconnexion réussie')
                
                setTimeout(() => {
                    window.location.href = 'index.html'
                }, 1000)
            } else {
                this.showError('Erreur lors de la déconnexion')
            }
        } catch (error) {
            console.error('Erreur de déconnexion:', error)
            this.showError('Erreur lors de la déconnexion')
        }
    }

    // Méthodes utilitaires
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    showError(message) {
        this.showMessage(message, 'error')
    }

    showSuccess(message) {
        this.showMessage(message, 'success')
    }

    showMessage(message, type) {
        // Supprimer les messages existants
        const existingMessages = document.querySelectorAll('.auth-message')
        existingMessages.forEach(msg => msg.remove())

        // Créer le nouveau message
        const messageEl = document.createElement('div')
        messageEl.className = `auth-message auth-message-${type}`
        messageEl.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `

        // Insérer le message
        const authContainer = document.querySelector('.auth-form-container:not([style*="display: none"])') || 
                             document.querySelector('.auth-form-container')
        if (authContainer) {
            authContainer.insertBefore(messageEl, authContainer.firstChild)
        } else {
            document.body.appendChild(messageEl)
        }

        // Auto-suppression après 5 secondes
        setTimeout(() => {
            messageEl.remove()
        }, 5000)
    }

    // Méthodes publiques pour compatibilité
    isLoggedIn() {
        return supabaseService.isAuthenticated()
    }

    getCurrentUser() {
        return supabaseService.getCurrentUser()
    }

    hasRole(role) {
        const profile = supabaseService.getUserProfile()
        return profile?.role === role
    }
}

// Fonctions globales pour les formulaires
function showLogin() {
    document.querySelector('.auth-form-container:first-child').style.display = 'block'
    document.getElementById('registerContainer').style.display = 'none'
}

function showRegister() {
    document.querySelector('.auth-form-container:first-child').style.display = 'none'
    document.getElementById('registerContainer').style.display = 'block'
}

function showForgotPassword() {
    const email = document.getElementById('email').value
    if (!email) {
        alert('Veuillez saisir votre email dans le champ de connexion d\'abord')
        return
    }
    
    const confirmed = confirm(`Envoyer un email de réinitialisation à ${email} ?`)
    if (confirmed && window.authSystem) {
        window.authSystem.handleForgotPassword(email)
    }
}

// Fonction globale de déconnexion
function logout() {
    if (window.authSystem) {
        window.authSystem.logout()
    }
}

// Initialiser le système d'authentification
let authSystem
document.addEventListener('DOMContentLoaded', async () => {
    authSystem = new AuthSystem()
    window.authSystem = authSystem
})