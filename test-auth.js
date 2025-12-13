// Test authentication for all user accounts
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

const testUsers = [
    { name: 'Khalid Noon', email: 'khalid@grandcity.pk', password: 'ceo123', role: 'executive' },
    { name: 'Salman', email: 'salman@grandcity.pk', password: 'md123', role: 'executive' },
    { name: 'Rehan', email: 'rehan@grandcity.pk', password: 'chair123', role: 'executive' },
    { name: 'Shahnawaz', email: 'shahnawaz@grandcity.pk', password: 'ops123', role: 'executive' },
    { name: 'Aslam', email: 'aslam@grandcity.pk', password: 'cfo123', role: 'executive' },
    { name: 'Ali Moeen', email: 'ali.moeen@grandcity.pk', password: 'cons123', role: 'executive' },
    { name: 'Ali Bin Nadeem', email: 'ali.nadeem@grandcity.pk', password: 'tech123', role: 'executive' },
    { name: 'Muhammad bin Waris', email: 'muhammad@grandcity.pk', password: 'mbw123', role: 'executive' },
    { name: 'Admin', email: 'admin@grandcity.pk', password: 'adm123', role: 'admin' }
];

async function testLogin(email, password, expectedName) {
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success && data.token) {
            console.log(`✅ ${expectedName}: Login successful`);
            console.log(`   Email: ${email}`);
            console.log(`   Role: ${data.user.role}`);
            console.log(`   Token: ${data.token.substring(0, 30)}...`);
            return { success: true, token: data.token };
        } else {
            console.log(`❌ ${expectedName}: Login failed`);
            console.log(`   Error: ${data.error}`);
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.log(`❌ ${expectedName}: Network error`);
        console.log(`   ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testProtectedEndpoint(token) {
    try {
        const response = await fetch(`${API_BASE}/api/executives`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return { success: true, count: data.length };
        } else {
            return { success: false, status: response.status };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function testWrongPassword(email) {
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password: 'wrongpassword123' })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(`✅ Wrong password correctly rejected for ${email}`);
            return true;
        } else {
            console.log(`❌ Wrong password was accepted for ${email} - SECURITY ISSUE!`);
            return false;
        }
    } catch (error) {
        console.log(`⚠️  Network error testing wrong password: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🔐 Testing Grand City Guest Pass Authentication System\n');
    console.log('=' .repeat(60));
    console.log('\n📝 Test 1: Login with correct credentials\n');

    let successCount = 0;
    let tokens = [];

    for (const user of testUsers) {
        const result = await testLogin(user.email, user.password, user.name);
        if (result.success) {
            successCount++;
            tokens.push(result.token);
        }
        console.log('');
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('=' .repeat(60));
    console.log(`\n📊 Login Test Results: ${successCount}/${testUsers.length} successful\n`);

    // Test wrong password
    console.log('=' .repeat(60));
    console.log('\n📝 Test 2: Login with wrong password\n');
    
    const wrongPasswordTest = await testWrongPassword('khalid@grandcity.pk');
    console.log('');

    // Test protected endpoint with valid token
    if (tokens.length > 0) {
        console.log('=' .repeat(60));
        console.log('\n📝 Test 3: Access protected endpoint with valid token\n');
        
        const protectedResult = await testProtectedEndpoint(tokens[0]);
        if (protectedResult.success) {
            console.log(`✅ Protected endpoint accessible with valid token`);
            console.log(`   Retrieved ${protectedResult.count} executives`);
        } else {
            console.log(`❌ Protected endpoint failed with valid token`);
        }
        console.log('');
    }

    // Test protected endpoint without token
    console.log('=' .repeat(60));
    console.log('\n📝 Test 4: Access protected endpoint without token\n');
    
    try {
        const response = await fetch(`${API_BASE}/api/executives`);
        if (response.status === 401) {
            console.log('✅ Protected endpoint correctly rejected request without token');
        } else {
            console.log(`⚠️  Protected endpoint returned status ${response.status} without token`);
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('\n✨ Test Summary\n');
    console.log(`   Total Users Tested: ${testUsers.length}`);
    console.log(`   Successful Logins: ${successCount}`);
    console.log(`   Failed Logins: ${testUsers.length - successCount}`);
    console.log(`   Wrong Password Test: ${wrongPasswordTest ? 'PASS' : 'FAIL'}`);
    console.log('\n' + '=' .repeat(60));
    
    if (successCount === testUsers.length && wrongPasswordTest) {
        console.log('\n✅ All tests passed! Authentication system is working correctly.\n');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the results above.\n');
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
