// Supabase Configuration - FiveM Dev Pro
const SUPABASE_URL = 'https://exzswzryjkbqpqivuuzg.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_evyAFedjzKTM71JNRUbm9g_Cd0YuykD'
const ADMIN_EMAIL = 'nxrsh27@gmail.com'

// Le CDN UMD expose le module dans window.supabase
// On récupère createClient depuis le module, puis on remplace window.supabase par le client
;(function () {
    const module = window.supabase

    if (!module || typeof module.createClient !== 'function') {
        console.error('Supabase CDN non chargé correctement.')
        return
    }

    const client = module.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Remplacer le module par le client instancié
    window.supabase = client
    window.ADMIN_EMAIL = ADMIN_EMAIL

    console.log('Supabase client initialisé ✓')
})()
