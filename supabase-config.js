// Supabase Configuration for FiveM Dev Pro
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

// Configuration Supabase (remplacez par vos vraies clés)
const SUPABASE_URL = 'https://tcqgvbqzfznqdykvgoay.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Sl9hFBQ57m0xrYO-ufHwvA_57VTOhbD'

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Configuration admin
const ADMIN_EMAIL = 'nxrsh27@gmail.com'

// Classe pour gérer l'authentification et les données
class SupabaseService {
    constructor() {
        this.supabase = supabase
        this.currentUser = null
        this.init()
    }

    async init() {
        // Vérifier la session actuelle
        const { data: { session } } = await this.supabase.auth.getSession()
        if (session) {
            this.currentUser = session.user
            await this.loadUserProfile()
        }

        // Écouter les changements d'authentification
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user
                await this.loadUserProfile()
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null
            }
        })
    }

    // Authentification
    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: userData.name,
                        server_name: userData.serverName,
                        role: 'client' // Par défaut client
                    }
                }
            })

            if (error) throw error

            // Créer le profil utilisateur
            if (data.user) {
                await this.createUserProfile(data.user.id, {
                    email,
                    name: userData.name,
                    server_name: userData.serverName,
                    role: 'client',
                    is_active: true
                })
            }

            return { success: true, data }
        } catch (error) {
            console.error('Erreur inscription:', error)
            return { success: false, error: error.message }
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            this.currentUser = data.user
            await this.loadUserProfile()

            return { success: true, data }
        } catch (error) {
            console.error('Erreur connexion:', error)
            return { success: false, error: error.message }
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut()
            if (error) throw error

            this.currentUser = null
            return { success: true }
        } catch (error) {
            console.error('Erreur déconnexion:', error)
            return { success: false, error: error.message }
        }
    }

    async resetPassword(email) {
        try {
            const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            })

            if (error) throw error

            return { success: true, message: 'Email de réinitialisation envoyé' }
        } catch (error) {
            console.error('Erreur reset password:', error)
            return { success: false, error: error.message }
        }
    }

    async updatePassword(newPassword) {
        try {
            const { error } = await this.supabase.auth.updateUser({
                password: newPassword
            })

            if (error) throw error

            return { success: true, message: 'Mot de passe mis à jour' }
        } catch (error) {
            console.error('Erreur update password:', error)
            return { success: false, error: error.message }
        }
    }

    // Gestion des profils utilisateur
    async createUserProfile(userId, profileData) {
        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .insert([{
                    id: userId,
                    ...profileData,
                    created_at: new Date().toISOString()
                }])

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur création profil:', error)
            return { success: false, error: error.message }
        }
    }

    async loadUserProfile() {
        if (!this.currentUser) return null

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single()

            if (error) throw error

            this.currentUser.profile = data
            return data
        } catch (error) {
            console.error('Erreur chargement profil:', error)
            return null
        }
    }

    async updateUserProfile(updates) {
        if (!this.currentUser) return { success: false, error: 'Non connecté' }

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .update(updates)
                .eq('id', this.currentUser.id)

            if (error) throw error

            await this.loadUserProfile()
            return { success: true, data }
        } catch (error) {
            console.error('Erreur mise à jour profil:', error)
            return { success: false, error: error.message }
        }
    }

    // Gestion des devis
    async createQuote(quoteData) {
        if (!this.currentUser) return { success: false, error: 'Non connecté' }

        try {
            const { data, error } = await this.supabase
                .from('quotes')
                .insert([{
                    ...quoteData,
                    user_id: this.currentUser.id,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur création devis:', error)
            return { success: false, error: error.message }
        }
    }

    async getQuotes(filters = {}) {
        try {
            let query = this.supabase.from('quotes').select(`
                *,
                user_profiles (
                    name,
                    email,
                    server_name
                )
            `)

            // Filtres pour les clients (seulement leurs devis)
            if (this.currentUser?.profile?.role === 'client') {
                query = query.eq('user_id', this.currentUser.id)
            }

            // Filtres additionnels
            if (filters.status) {
                query = query.eq('status', filters.status)
            }

            const { data, error } = await query.order('created_at', { ascending: false })

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur récupération devis:', error)
            return { success: false, error: error.message }
        }
    }

    async updateQuote(quoteId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('quotes')
                .update(updates)
                .eq('id', quoteId)

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur mise à jour devis:', error)
            return { success: false, error: error.message }
        }
    }

    // Gestion des factures
    async createInvoice(invoiceData) {
        try {
            const { data, error } = await this.supabase
                .from('invoices')
                .insert([{
                    ...invoiceData,
                    created_at: new Date().toISOString()
                }])

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur création facture:', error)
            return { success: false, error: error.message }
        }
    }

    async getInvoices(filters = {}) {
        try {
            let query = this.supabase.from('invoices').select(`
                *,
                user_profiles (
                    name,
                    email,
                    server_name
                )
            `)

            // Filtres pour les clients (seulement leurs factures)
            if (this.currentUser?.profile?.role === 'client') {
                query = query.eq('user_id', this.currentUser.id)
            }

            // Filtres additionnels
            if (filters.status) {
                query = query.eq('status', filters.status)
            }

            const { data, error } = await query.order('created_at', { ascending: false })

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur récupération factures:', error)
            return { success: false, error: error.message }
        }
    }

    async updateInvoice(invoiceId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('invoices')
                .update(updates)
                .eq('id', invoiceId)

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur mise à jour facture:', error)
            return { success: false, error: error.message }
        }
    }

    // Gestion des abonnements
    async getSubscriptions() {
        if (!this.currentUser) return { success: false, error: 'Non connecté' }

        try {
            const { data, error } = await this.supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur récupération abonnements:', error)
            return { success: false, error: error.message }
        }
    }

    async updateSubscription(subscriptionId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('subscriptions')
                .update(updates)
                .eq('id', subscriptionId)

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur mise à jour abonnement:', error)
            return { success: false, error: error.message }
        }
    }

    // Fonctions admin
    async getAllUsers() {
        if (!this.isAdmin()) return { success: false, error: 'Accès refusé' }

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur récupération utilisateurs:', error)
            return { success: false, error: error.message }
        }
    }

    async updateUser(userId, updates) {
        if (!this.isAdmin()) return { success: false, error: 'Accès refusé' }

        try {
            const { data, error } = await this.supabase
                .from('user_profiles')
                .update(updates)
                .eq('id', userId)

            if (error) throw error
            return { success: true, data }
        } catch (error) {
            console.error('Erreur mise à jour utilisateur:', error)
            return { success: false, error: error.message }
        }
    }

    // Utilitaires
    isAuthenticated() {
        return !!this.currentUser
    }

    isAdmin() {
        return this.currentUser?.email === ADMIN_EMAIL || this.currentUser?.profile?.role === 'admin'
    }

    getCurrentUser() {
        return this.currentUser
    }

    getUserProfile() {
        return this.currentUser?.profile
    }
}

// Instance globale
const supabaseService = new SupabaseService()
window.supabaseService = supabaseService

export default supabaseService