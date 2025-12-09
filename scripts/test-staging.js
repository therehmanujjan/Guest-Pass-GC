#!/usr/bin/env node

/**
 * Staging Environment Test Script
 * Tests the deployment package in a staging environment
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

class StagingTester {
    constructor() {
        this.packageDir = path.join(__dirname, '..', 'package');
        this.stagingPort = 3001;
        this.testResults = {
            passed: [],
            failed: [],
            warnings: []
        };
        this.serverProcess = null;
    }

    async runStagingTests() {
        console.log('🧪 Starting staging environment tests...');
        
        try {
            // Extract package
            await this.extractPackage();
            
            // Start staging server
            await this.startStagingServer();
            
            // Wait for server to be ready
            await this.waitForServer();
            
            // Run functional tests
            await this.runFunctionalTests();
            
            // Run performance tests
            await this.runPerformanceTests();
            
            // Run security tests
            await this.runSecurityTests();
            
            // Stop staging server
            await this.stopStagingServer();
            
            // Generate test report
            await this.generateTestReport();
            
            console.log('✅ Staging tests completed!');
            this.printResults();
            
            return this.testResults.failed.length === 0;
            
        } catch (error) {
            console.error('❌ Staging tests failed:', error.message);
            await this.stopStagingServer();
            return false;
        }
    }

    async extractPackage() {
        console.log('📦 Extracting package for staging...');
        
        const packageFile = path.join(this.packageDir, 'guest-pass-system-v1.0.0.tar.gz');
        const extractDir = path.join(__dirname, '..', 'staging');
        
        if (!fs.existsSync(packageFile)) {
            throw new Error('Package file not found');
        }
        
        // Create staging directory
        if (fs.existsSync(extractDir)) {
            fs.rmSync(extractDir, { recursive: true, force: true });
        }
        fs.mkdirSync(extractDir, { recursive: true });
        
        // Extract package
        try {
            execSync(`cd ${extractDir} && tar -xzf ${packageFile}`, { stdio: 'inherit' });
            console.log('✅ Package extracted successfully');
        } catch (error) {
            throw new Error(`Failed to extract package: ${error.message}`);
        }
    }

    async startStagingServer() {
        console.log('🚀 Starting staging server...');
        
        const stagingDir = path.join(__dirname, '..', 'staging');
        const mainFile = path.join(stagingDir, 'assets', 'guest-pass-system-clean.html');
        
        if (!fs.existsSync(mainFile)) {
            throw new Error('Main application file not found in staging directory');
        }
        
        // Create a simple HTTP server to serve the staging content
        this.serverProcess = spawn('python3', ['-m', 'http.server', this.stagingPort], {
            cwd: stagingDir,
            stdio: 'pipe'
        });
        
        this.serverProcess.stdout.on('data', (data) => {
            console.log(`Server: ${data}`);
        });
        
        this.serverProcess.stderr.on('data', (data) => {
            console.error(`Server Error: ${data}`);
        });
        
        console.log(`✅ Staging server started on port ${this.stagingPort}`);
    }

    async waitForServer() {
        console.log('⏳ Waiting for server to be ready...');
        
        const maxAttempts = 30;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            try {
                const response = await this.makeRequest(`http://localhost:${this.stagingPort}`);
                if (response.statusCode === 200) {
                    console.log('✅ Server is ready');
                    return;
                }
            } catch (error) {
                // Server not ready yet
            }
            
            await this.sleep(1000);
            attempts++;
        }
        
        throw new Error('Server failed to start within timeout');
    }

    async runFunctionalTests() {
        console.log('🔧 Running functional tests...');
        
        const tests = [
            {
                name: 'Main page loads',
                url: `http://localhost:${this.stagingPort}/assets/guest-pass-system-clean.html`,
                expectedStatus: 200,
                expectedContent: 'Guest Pass System'
            },
            {
                name: 'JavaScript libraries load',
                url: `http://localhost:${this.stagingPort}/assets/js/react.production.min.js`,
                expectedStatus: 200,
                expectedContent: null
            },
            {
                name: 'QR code library loads',
                url: `http://localhost:${this.stagingPort}/assets/js/qrcode.min.js`,
                expectedStatus: 200,
                expectedContent: null
            },
            {
                name: 'CSS files load',
                url: `http://localhost:${this.stagingPort}/assets/css/guest-pass-system-clean.css`,
                expectedStatus: 200,
                expectedContent: null
            }
        ];
        
        for (const test of tests) {
            try {
                const response = await this.makeRequest(test.url);
                
                if (response.statusCode === test.expectedStatus) {
                    if (test.expectedContent) {
                        const content = response.body;
                        if (content.includes(test.expectedContent)) {
                            this.testResults.passed.push({
                                test: test.name,
                                message: 'Content verification passed'
                            });
                        } else {
                            this.testResults.failed.push({
                                test: test.name,
                                message: 'Content verification failed',
                                expected: test.expectedContent,
                                actual: 'Content not found'
                            });
                        }
                    } else {
                        this.testResults.passed.push({
                            test: test.name,
                            message: 'Status code verification passed'
                        });
                    }
                } else {
                    this.testResults.failed.push({
                        test: test.name,
                        message: 'Status code verification failed',
                        expected: test.expectedStatus,
                        actual: response.statusCode
                    });
                }
            } catch (error) {
                this.testResults.failed.push({
                    test: test.name,
                    message: 'Request failed',
                    error: error.message
                });
            }
        }
    }

    async runPerformanceTests() {
        console.log('⚡ Running performance tests...');
        
        const testUrl = `http://localhost:${this.stagingPort}/assets/guest-pass-system-clean.html`;
        const iterations = 5;
        const responseTimes = [];
        
        for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            try {
                await this.makeRequest(testUrl);
                const responseTime = Date.now() - startTime;
                responseTimes.push(responseTime);
            } catch (error) {
                this.testResults.failed.push({
                    test: 'Performance test',
                    message: `Request ${i + 1} failed`,
                    error: error.message
                });
            }
        }
        
        if (responseTimes.length > 0) {
            const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
            const maxResponseTime = Math.max(...responseTimes);
            
            if (avgResponseTime < 1000) { // Less than 1 second
                this.testResults.passed.push({
                    test: 'Performance test',
                    message: `Average response time: ${avgResponseTime}ms`
                });
            } else {
                this.testResults.warnings.push({
                    test: 'Performance test',
                    message: `High average response time: ${avgResponseTime}ms`
                });
            }
            
            this.testResults.passed.push({
                test: 'Performance test',
                message: `Max response time: ${maxResponseTime}ms`
            });
        }
    }

    async runSecurityTests() {
        console.log('🔐 Running security tests...');
        
        // Test for common security headers
        const testUrl = `http://localhost:${this.stagingPort}/assets/guest-pass-system-clean.html`;
        
        try {
            const response = await this.makeRequest(testUrl);
            const headers = response.headers;
            
            const securityHeaders = [
                'content-security-policy',
                'x-frame-options',
                'x-content-type-options',
                'x-xss-protection'
            ];
            
            let foundSecurityHeaders = 0;
            
            for (const header of securityHeaders) {
                if (headers[header] || headers[header.toLowerCase()]) {
                    foundSecurityHeaders++;
                    this.testResults.passed.push({
                        test: 'Security headers',
                        message: `Found security header: ${header}`
                    });
                }
            }
            
            if (foundSecurityHeaders === 0) {
                this.testResults.warnings.push({
                    test: 'Security headers',
                    message: 'No security headers found'
                });
            }
            
        } catch (error) {
            this.testResults.failed.push({
                test: 'Security test',
                message: 'Security test failed',
                error: error.message
            });
        }
    }

    async stopStagingServer() {
        if (this.serverProcess) {
            console.log('🛑 Stopping staging server...');
            this.serverProcess.kill();
            this.serverProcess = null;
            console.log('✅ Staging server stopped');
        }
    }

    async generateTestReport() {
        console.log('📊 Generating test report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            version: require('../package.json').version,
            stagingPort: this.stagingPort,
            results: this.testResults,
            summary: {
                totalPassed: this.testResults.passed.length,
                totalFailed: this.testResults.failed.length,
                totalWarnings: this.testResults.warnings.length,
                overallStatus: this.testResults.failed.length === 0 ? 'PASSED' : 'FAILED'
            }
        };
        
        const reportPath = path.join(__dirname, '..', 'staging-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 Test report saved to: ${reportPath}`);
    }

    printResults() {
        console.log('\n📊 Staging Test Results:');
        console.log(`✅ Passed: ${this.testResults.passed.length}`);
        console.log(`❌ Failed: ${this.testResults.failed.length}`);
        console.log(`⚠️ Warnings: ${this.testResults.warnings.length}`);
        
        if (this.testResults.failed.length > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.failed.forEach(test => {
                console.log(`  - ${test.test}: ${test.message}`);
                if (test.error) {
                    console.log(`    Error: ${test.error}`);
                }
            });
        }
        
        if (this.testResults.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            this.testResults.warnings.forEach(test => {
                console.log(`  - ${test.test}: ${test.message}`);
            });
        }
        
        const overallStatus = this.testResults.failed.length === 0 ? 'PASSED' : 'FAILED';
        console.log(`\n🎯 Overall Status: ${overallStatus}`);
    }

    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                });
            });
            
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.abort();
                reject(new Error('Request timeout'));
            });
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the staging tests
if (require.main === module) {
    const tester = new StagingTester();
    tester.runStagingTests().catch(console.error);
}

module.exports = StagingTester;