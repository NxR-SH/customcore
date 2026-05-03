// Reset Password functionality
import supabaseService from './supabase-config.js'

class ResetPasswordManager {
    constructor() {
        this.init()
    }

    init() {
        // Vérifier si nous avons un token de réinitialisation dans l'URL
        this.checkResetToken()
        
        // Initialiser le formulaire
        this.initializeForm()
    }

    checkResetToken() {
        const urlParams = new URLSearchParams(window.location.search)
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        const type = urlParams.get('type')

        if (type !== 'recovery' || !accessToken) {
            this.showError('Lien de réinitialisation invalide ou expiré')
            setTimeout(() => {
                window.location.href = 'login.html'
            }, 3000)
            return
        }

        // Le token est valide, on peut procéder à la réinitialisation
        this.showSuccess('Lien de réinitialisation valide. Vous pouvez maintenant changer votre mot de passe.')
    }

    initializeForm() {
        const form = document.getElementById('resetPasswordForm')
        if (form) {
            form.addEventListener('submit', (e) => this.handleResetPassword(e))
        }

        // Validation en temps réel
        const newPasswordInput = document.getElementById('newPassword')
        const confirmPasswordInput = document.getElementById('confirmPassword')

        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch()
            })
        }

        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', () => {
                this.validatePasswordStrength()
            })
        }
    }

    validatePasswordStrength() {
        const password = document.getElementById('newPassword').value
        const minLength = 6
        
        if (password.length < minLength) {
            this.showFieldError('newPassword', `Le mot de passe doit contenir au moins ${minLength} caractères`)
            return false
        }
        
        this.clearFieldError('newPassword')
        return true
    }

    validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value
        const confirmPassword = document.getElementById('confirmPassword').value
        
        if (confirmPassword && newPassword !== confirmPassword) {
            this.showFieldError('confirmPassword', 'Les mots de passe ne correspondent pas')
            return false
        }
        
        this.clearFieldError('confirmPassword')
        return true
    }

    async handleResetPassword(e) {
        e.preventDefault()
        
        const newPassword = document.getElementById('newPassword').value
        const confirmPassword = document.getElementById('confirmPassword').value

        // Validation
        if (!this.validatePasswordStrength() || !this.validatePasswordMatch()) {
            return
        }

        if (newPassword !== confirmPassword) {
            this.showError('Les mots de passe ne correspondent pas')
            return
        }

        if (newPassword.length < 6) {
            this.showError('Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        // Désactiver le bouton pendant le traitement
        const submitBtn = e.target.querySelector('button[type="submit"]')
        const originalText = submitBtn.innerHTML
        submitBtn.disabled = true
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mise à jour...'

        try {
            const result = await supabaseService.updatePassword(newPassword)
            
            if (result.success) {
                this.showSuccess('Mot de passe mis à jour avec succès ! Redirection vers la connexion...')
                
                setTimeout(() => {
                    window.location.href = 'login.html?message=password-updated'
                }, 2000)
            } else {
                this.showError(result.error || 'Erreur lors de la mise à jour du mot de passe')
            }
        } catch (error) {
            console.error('Erreur reset password:', error)
            this.showError('Erreur lors de la mise à jour du mot de passe')
        } finally {
            submitBtn.disabled = false
            submitBtn.innerHTML = originalText
        }
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
        const authContainer = document.querySelector('.auth-form-container')
        if (authContainer) {
            authContainer.insertBefore(messageEl, authContainer.firstChild)
        }

        // Auto-suppression après 5 secondes pour les messages de succès
        if (type === 'success') {
            setTimeout(() => {
                messageEl.remove()
            }, 5000)
        }
    }

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId)
        if (!field) return

        // Supprimer l'erreur existante
        this.clearFieldError(fieldId)

        // Ajouter la classe d'erreur
        field.classList.add('field-error')

        // Créer le message d'erreur
        const errorEl = document.createElement('small')
        errorEl.className = 'field-error-message'
        errorEl.textContent = message

        // Insérer après le champ
        field.parentNode.insertBefore(errorEl, field.nextSibling)
    }

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId)
        if (!field) return

        field.classList.remove('field-error')
        
        const errorMessage = field.parentNode.querySelector('.field-error-message')
        if (errorMessage) {
            errorMessage.remove()
        }
    }
}

// Initialiser le gestionnaire de réinitialisation
document.addEventListener('DOMContentLoaded', () => {
    new ResetPasswordManager()
})