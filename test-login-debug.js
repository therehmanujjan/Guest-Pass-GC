// Quick debug script to test login
const http = require('http');

async function testLogin() {
    // First, get executives list
    console.log('1. Testing /api/executives endpoint...');
    
    const execOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/executives',
        method: 'GET'
    };
    
    const executives = await new Promise((resolve, reject) => {
        const req = http.request(execOptions, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(body));
                } else {
                    reject(`Failed with status ${res.statusCode}: ${body}`);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
    
    console.log(`✓ Retrieved ${executives.length} executives`);
    console.log('\nExecutives:');
    executives.forEach(exec => {
        console.log(`  - ${exec.name} (${exec.position}) - Email: ${exec.email}`);
    });
    
    // Test login with first executive
    if (executives.length > 0) {
        const firstExec = executives[0];
        console.log(`\n2. Testing login with: ${firstExec.name}`);
        console.log(`   Email: ${firstExec.email}`);
        
        // Try with the password from migration
        const passwords = {
            'khalid@grandcity.pk': 'ceo123',
            'salman@grandcity.pk': 'md123',
            'rehan@grandcity.pk': 'chair123',
            'shahnawaz@grandcity.pk': 'ops123',
            'aslam@grandcity.pk': 'cfo123',
            'ali.moeen@grandcity.pk': 'cons123',
            'ali.nadeem@grandcity.pk': 'tech123',
            'muhammad@grandcity.pk': 'mbw123',
            'admin@grandcity.pk': 'adm123'
        };
        
        const password = passwords[firstExec.email.toLowerCase()];
        
        if (password) {
            console.log(`   Password: ${password}`);
            
            const loginData = JSON.stringify({
                email: firstExec.email,
                password: password
            });
            
            const loginOptions = {
                hostname: 'localhost',
                port: 3000,
                path: '/api/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(loginData)
                }
            };
            
            const loginResult = await new Promise((resolve, reject) => {
                const req = http.request(loginOptions, (res) => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        resolve({
                            status: res.statusCode,
                            body: body ? JSON.parse(body) : {}
                        });
                    });
                });
                req.on('error', reject);
                req.write(loginData);
                req.end();
            });
            
            console.log(`\n3. Login Result (Status: ${loginResult.status}):`);
            if (loginResult.status === 200) {
                console.log('   ✓ SUCCESS!');
                console.log(`   Token: ${loginResult.body.token?.substring(0, 30)}...`);
                console.log(`   User: ${loginResult.body.user?.name} (${loginResult.body.user?.role})`);
            } else {
                console.log('   ✗ FAILED');
                console.log(`   Error: ${loginResult.body.error}`);
            }
        } else {
            console.log(`   ⚠ No password mapping found for ${firstExec.email}`);
        }
    }
}

testLogin().catch(err => {
    console.error('\n❌ Error:', err);
    process.exit(1);
});
