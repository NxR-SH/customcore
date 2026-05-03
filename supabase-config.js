// Supabase Configuration - FiveM Dev Pro
var SUPABASE_URL = 'https://exzswzryjkbqpqivuuzg.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_evyAFedjzKTM71JNRUbm9g_Cd0YuykD';
var ADMIN_EMAIL = 'nxrsh27@gmail.com';

// Le CDN UMD expose le module dans window.supabase
// On cree le client sous window.sb pour ne pas ecraser le module
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.sb = sb;
window.ADMIN_EMAIL = ADMIN_EMAIL;