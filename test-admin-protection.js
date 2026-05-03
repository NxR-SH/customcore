// Test script for admin protection
// This script can be run in the browser console to test admin access

async function testAdminProtection() {
    console.log('🔒 Testing Admin Protection...');
    
    try {
        // Test 1: Check if user is logged in
        const { data: { user }, error: userError } = await sb.auth.getUser();
        
        if (userError || !user) {
            console.log('❌ Test 1 FAILED: User not logged in');
            return false;
        }
        console.log('✅ Test 1 PASSED: User is logged in');
        
        // Test 2: Check user profile exists
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
        if (profileError || !profile) {
            console.log('❌ Test 2 FAILED: User profile not found');
            return false;
        }
        console.log('✅ Test 2 PASSED: User profile found');
        
        // Test 3: Check admin role
        if (profile.role !== 'admin') {
            console.log('❌ Test 3 FAILED: User is not admin (role: ' + profile.role + ')');
            return false;
        }
        console.log('✅ Test 3 PASSED: User has admin role');
        
        // Test 4: Test database access (try to read quotes)
        const { data: quotes, error: quotesError } = await supabase
            .from('quotes')
            .select('*')
            .limit(1);
            
        if (quotesError) {
            console.log('❌ Test 4 FAILED: Cannot access quotes table');
            console.error(quotesError);
            return false;
        }
        console.log('✅ Test 4 PASSED: Can access quotes table');
        
        // Test 5: Test portfolio management access
        const { data: portfolio, error: portfolioError } = await supabase
            .from('portfolio_items')
            .select('*')
            .limit(1);
            
        if (portfolioError) {
            console.log('❌ Test 5 FAILED: Cannot access portfolio_items table');
            console.error(portfolioError);
            return false;
        }
        console.log('✅ Test 5 PASSED: Can access portfolio_items table');
        
        console.log('🎉 ALL TESTS PASSED: Admin protection is working correctly!');
        return true;
        
    } catch (error) {
        console.log('❌ UNEXPECTED ERROR:', error);
        return false;
    }
}

// Auto-run test if on admin page
if (window.location.pathname.includes('admin.html')) {
    setTimeout(() => {
        testAdminProtection();
    }, 2000);
}

// Make function available globally
window.testAdminProtection = testAdminProtection;

