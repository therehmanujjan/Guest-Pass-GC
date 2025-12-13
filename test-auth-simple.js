#!/usr/bin/env node
/**
 * Authentication Test Script for Grand City Guest Pass System
 * 
 * This script tests the new individual password authentication system.
 * 
 * PREREQUISITE: Server must be running on http://localhost:3000
 * Run: node server.js (in a separate terminal)
 * 
 * Then run this script: node test-auth-simple.js
 */

const http = require('http');

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : {}
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testLogin(email, password, name) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options, { email, password });
        
        if (response.status === 200 && response.body.success) {
            console.log(`✅ ${name}: Login successful`);
            console.log(`   Email: ${email}`);
            console.log(`   Role: ${response.body.user.role}`);
            return true;
        } else {
            console.log(`❌ ${name}: Login failed - ${response.body.error || 'Unknown error'}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${name}: Network error - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('\n🔐 Grand City Guest Pass - Authentication Test');
    console.log('=' .repeat(60));
    console.log('\nTesting individual password authentication...\n');

    const tests = [
        { name: 'Khalid Noon (CEO)', email: 'khalid@grandcity.pk', password: 'ceo123' },
        { name: 'Salman (MD)', email: 'salman@grandcity.pk', password: 'md123' },
        { name: 'Rehan (Chairman)', email: 'rehan@grandcity.pk', password: 'chair123' },
        { name: 'Shahnawaz (Operations)', email: 'shahnawaz@grandcity.pk', password: 'ops123' },
        { name: 'Aslam (CFO)', email: 'aslam@grandcity.pk', password: 'cfo123' },
        { name: 'Ali Moeen (Consultant)', email: 'ali.moeen@grandcity.pk', password: 'cons123' },
        { name: 'Ali Bin Nadeem (Tech)', email: 'ali.nadeem@grandcity.pk', password: 'tech123' },
        { name: 'Muhammad bin Waris', email: 'muhammad@grandcity.pk', password: 'mbw123' },
        { name: 'Admin', email: 'admin@grandcity.pk', password: 'adm123' }
    ];

    let passed = 0;
    
    for (const test of tests) {
        const success = await testLogin(test.email, test.password, test.name);
        if (success) passed++;
        await new Promise(r => setTimeout(r, 100)); // Small delay
    }

    console.log('\n' + '=' .repeat(60));
    console.log(`\n📊 Results: ${passed}/${tests.length} tests passed\n`);
    
    if (passed === tests.length) {
        console.log('✅ All authentication tests passed!');
        console.log('   Universal password has been successfully replaced.');
        console.log('   Each user now has their own individual password.\n');
    } else {
        console.log('⚠️  Some tests failed. Please check the output above.\n');
    }
}

main().catch(err => {
    console.error('\n❌ Test failed with error:', err.message);
    console.log('\n💡 Make sure the server is running: node server.js\n');
    process.exit(1);
});
