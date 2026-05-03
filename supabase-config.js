// Supabase Configuration - FiveM Dev Pro
const SUPABASE_URL = 'https://exzswzryjkbqpqivuuzg.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_evyAFedjzKTM71JNRUbm9g_Cd0YuykD'
const ADMIN_EMAIL = 'nxrsh27@gmail.com'

// Le CDN @supabase/supabase-js expose window.supabase avec createClient
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Écraser window.supabase avec le client (pas le module)
window.supabase = supabase
window.ADMIN_EMAIL = ADMIN_EMAIL
