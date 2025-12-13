// Test all role-based logins
const http = require('http');

const testAccounts = [
    { name: 'Staff Member', email: 'staff@grandcity.pk', password: 'pso123' },
    { name: 'Security Guard', email: 'guard@grandcity.pk', password: 'sec123' },
    { name: 'Receptionist', email: 'receptionist@grandcity.pk', password: 'front123' },
    { name: 'Admin', email: 'admin@grandcity.pk', password: 'adm123' }
];

async function testLogin(name, email, password) {
    const loginData = JSON.stringify({ email, password });
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(loginData)
        }
    };
    
    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const result = body ? JSON.parse(body) : {};
                if (res.statusCode === 200 && result.success) {
                    console.log(`✅ ${name}: Login successful`);
                    console.log(`   Role: ${result.user.role}`);
                    resolve(true);
                } else {
                    console.log(`❌ ${name}: Login failed`);
                    console.log(`   Error: ${result.error || 'Unknown error'}`);
                    resolve(false);
                }
            });
        });
        req.on('error', (err) => {
            console.log(`❌ ${name}: Network error - ${err.message}`);
            resolve(false);
        });
        req.write(loginData);
        req.end();
    });
}

async function runTests() {
    console.log('\n🔐 Testing Role-Based Logins\n');
    console.log('=' .repeat(60));
    
    let passed = 0;
    
    for (const account of testAccounts) {
        const success = await testLogin(account.name, account.email, account.password);
        if (success) passed++;
        console.log('');
        await new Promise(r => setTimeout(r, 100));
    }
    
    console.log('=' .repeat(60));
    console.log(`\n📊 Results: ${passed}/${testAccounts.length} tests passed\n`);
    
    if (passed === testAccounts.length) {
        console.log('✅ All role-based logins working!\n');
    } else {
        console.log('⚠️  Some logins failed. Check output above.\n');
    }
}

runTests().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
