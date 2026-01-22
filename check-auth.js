/**
 * Quick Authentication Check Script
 * Run this to verify your Entra ID configuration
 */

const fetch = require('node-fetch');

async function checkAuth() {
    console.log('🔍 Checking Authentication Configuration...\n');
    
    // Check environment variables
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const apiKey = process.env.FOUNDRY_API_KEY;
    
    console.log('📋 Environment Variables:');
    console.log(`  AZURE_TENANT_ID: ${tenantId ? tenantId.substring(0, 8) + '...' : '❌ NOT SET'}`);
    console.log(`  AZURE_CLIENT_ID: ${clientId ? clientId.substring(0, 8) + '...' : '❌ NOT SET'}`);
    console.log(`  AZURE_CLIENT_SECRET: ${clientSecret ? '✅ SET (' + clientSecret.length + ' chars)' : '❌ NOT SET'}`);
    console.log(`  FOUNDRY_API_KEY: ${apiKey ? '✅ SET (' + apiKey.length + ' chars)' : '❌ NOT SET'}`);
    console.log('');
    
    // Check if proxy server is running
    console.log('🌐 Checking Proxy Server...');
    try {
        const healthResponse = await fetch('http://localhost:3001/health');
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('  ✅ Proxy server is running');
            console.log(`  Authentication method: ${health.auth}`);
            console.log(`  Endpoint: ${health.endpoint}`);
        } else {
            console.log('  ⚠️  Proxy server responded with error:', healthResponse.status);
        }
    } catch (error) {
        console.log('  ❌ Proxy server is NOT running or not accessible');
        console.log('  Error:', error.message);
        console.log('  💡 Start the server with: npm start');
        return;
    }
    
    // Check diagnostic endpoint
    console.log('\n🔬 Running Diagnostics...');
    try {
        const diagResponse = await fetch('http://localhost:3001/diagnose-auth');
        if (diagResponse.ok) {
            const diag = await diagResponse.json();
            console.log('\n📊 Diagnostic Results:');
            console.log(JSON.stringify(diag, null, 2));
            
            if (diag.issues && diag.issues.length > 0) {
                console.log('\n⚠️  Issues Found:');
                diag.issues.forEach(issue => console.log('  -', issue));
            }
            
            if (diag.recommendations && diag.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                diag.recommendations.forEach(rec => console.log('  -', rec));
            }
            
            if (diag.tokenTest) {
                console.log('\n🎫 Token Test:');
                console.log(`  Status: ${diag.tokenTest.status}`);
                console.log(`  Message: ${diag.tokenTest.message}`);
            }
        } else {
            console.log('  ⚠️  Diagnostic endpoint returned:', diagResponse.status);
        }
    } catch (error) {
        console.log('  ❌ Failed to run diagnostics:', error.message);
    }
    
    console.log('\n✅ Check complete!');
}

checkAuth().catch(console.error);
