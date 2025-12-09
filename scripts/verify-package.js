#!/usr/bin/env node

/**
 * Package Verification Script
 * Verifies integrity of packaged assets and resources
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PackageVerifier {
    constructor() {
        this.packageDir = path.join(__dirname, '..', 'package');
        this.manifestPath = path.join(this.packageDir, 'manifest.json');
        this.verificationResults = {
            passed: [],
            failed: [],
            warnings: []
        };
    }

    async verifyPackage() {
        console.log('🔍 Starting package verification process...');
        
        try {
            // Load manifest
            const manifest = this.loadManifest();
            
            // Verify file integrity
            await this.verifyFileIntegrity(manifest);
            
            // Verify package structure
            await this.verifyPackageStructure();
            
            // Verify dependencies
            await this.verifyDependencies();
            
            // Verify security
            await this.verifySecurity();
            
            // Generate verification report
            await this.generateVerificationReport();
            
            console.log('✅ Package verification completed!');
            this.printResults();
            
            return this.verificationResults.failed.length === 0;
            
        } catch (error) {
            console.error('❌ Package verification failed:', error.message);
            return false;
        }
    }

    loadManifest() {
        console.log('📋 Loading package manifest...');
        
        if (!fs.existsSync(this.manifestPath)) {
            throw new Error('Package manifest not found');
        }
        
        const manifestContent = fs.readFileSync(this.manifestPath, 'utf8');
        return JSON.parse(manifestContent);
    }

    async verifyFileIntegrity(manifest) {
        console.log('🔒 Verifying file integrity...');
        
        const { checksums, assets, resources } = manifest;
        const allFiles = { ...assets, ...resources };
        
        for (const [filename, fileInfo] of Object.entries(allFiles)) {
            const filePath = path.join(this.packageDir, fileInfo.path);
            
            if (!fs.existsSync(filePath)) {
                this.verificationResults.failed.push({
                    type: 'missing_file',
                    filename,
                    message: `File not found: ${filePath}`
                });
                continue;
            }
            
            // Verify checksum
            const expectedChecksum = checksums[filename];
            if (expectedChecksum) {
                const actualChecksum = this.calculateChecksum(filePath);
                
                if (actualChecksum === expectedChecksum) {
                    this.verificationResults.passed.push({
                        type: 'checksum_verification',
                        filename,
                        message: 'Checksum verification passed'
                    });
                } else {
                    this.verificationResults.failed.push({
                        type: 'checksum_mismatch',
                        filename,
                        message: `Checksum mismatch for ${filename}`,
                        expected: expectedChecksum,
                        actual: actualChecksum
                    });
                }
            } else {
                this.verificationResults.warnings.push({
                    type: 'missing_checksum',
                    filename,
                    message: `No checksum found for ${filename}`
                });
            }
            
            // Verify file size
            const actualSize = fs.statSync(filePath).size;
            if (fileInfo.size && actualSize !== fileInfo.size) {
                this.verificationResults.warnings.push({
                    type: 'size_mismatch',
                    filename,
                    message: `File size mismatch for ${filename}`,
                    expected: fileInfo.size,
                    actual: actualSize
                });
            }
        }
    }

    calculateChecksum(filePath) {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    async verifyPackageStructure() {
        console.log('📁 Verifying package structure...');
        
        const requiredDirectories = [
            'assets',
            'assets/js',
            'assets/css',
            'assets/images',
            'resources',
            'resources/docs',
            'resources/config',
            'resources/database',
            'resources/deployment'
        ];
        
        for (const dir of requiredDirectories) {
            const dirPath = path.join(this.packageDir, dir);
            if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                this.verificationResults.passed.push({
                    type: 'directory_structure',
                    directory: dir,
                    message: `Directory exists: ${dir}`
                });
            } else {
                this.verificationResults.failed.push({
                    type: 'missing_directory',
                    directory: dir,
                    message: `Directory not found: ${dir}`
                });
            }
        }
    }

    async verifyDependencies() {
        console.log('📦 Verifying dependencies...');
        
        // Check for required JavaScript libraries
        const requiredLibraries = [
            'assets/js/babel.min.js',
            'assets/js/react.production.min.js',
            'assets/js/react-dom.production.min.js',
            'assets/js/qrcode.min.js',
            'assets/js/html2canvas.min.js',
            'assets/js/jsQR.js'
        ];
        
        for (const lib of requiredLibraries) {
            const libPath = path.join(this.packageDir, lib);
            if (fs.existsSync(libPath)) {
                this.verificationResults.passed.push({
                    type: 'dependency_check',
                    library: lib,
                    message: `Required library found: ${lib}`
                });
            } else {
                this.verificationResults.failed.push({
                    type: 'missing_dependency',
                    library: lib,
                    message: `Required library missing: ${lib}`
                });
            }
        }
    }

    async verifySecurity() {
        console.log('🔐 Verifying security...');
        
        // Check for sensitive data exposure
        const sensitivePatterns = [
            /password\s*=\s*['"][^'"]+['"]/gi,
            /api_key\s*=\s*['"][^'"]+['"]/gi,
            /secret\s*=\s*['"][^'"]+['"]/gi,
            /sk-[a-zA-Z0-9]{24,}/gi, // Stripe secret key pattern
            /pk_[a-zA-Z0-9]{24,}/gi  // Stripe public key pattern
        ];
        
        const allFiles = this.getAllFilesInPackage();
        
        for (const filePath of allFiles) {
            if (filePath.endsWith('.js') || filePath.endsWith('.html') || filePath.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    for (const pattern of sensitivePatterns) {
                        if (pattern.test(content)) {
                            this.verificationResults.warnings.push({
                                type: 'potential_secret_exposure',
                                file: filePath,
                                message: `Potential sensitive data found in ${filePath}`
                            });
                        }
                    }
                } catch (error) {
                    // Skip binary files or files that can't be read
                }
            }
        }
        
        // Verify CSP headers in configuration
        const configFiles = [
            'resources/config/vercel.json',
            'resources/config/package.json'
        ];
        
        for (const configFile of configFiles) {
            const configPath = path.join(this.packageDir, configFile);
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                if (content.includes('Content-Security-Policy') || content.includes('csp')) {
                    this.verificationResults.passed.push({
                        type: 'security_header',
                        file: configFile,
                        message: `Security headers configured in ${configFile}`
                    });
                }
            }
        }
    }

    getAllFilesInPackage() {
        const files = [];
        
        function walkDirectory(dir) {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stat = fs.statSync(itemPath);
                if (stat.isDirectory()) {
                    walkDirectory(itemPath);
                } else {
                    files.push(itemPath);
                }
            }
        }
        
        walkDirectory(this.packageDir);
        return files;
    }

    async generateVerificationReport() {
        console.log('📊 Generating verification report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            version: require('../package.json').version,
            results: this.verificationResults,
            summary: {
                totalPassed: this.verificationResults.passed.length,
                totalFailed: this.verificationResults.failed.length,
                totalWarnings: this.verificationResults.warnings.length,
                overallStatus: this.verificationResults.failed.length === 0 ? 'PASSED' : 'FAILED'
            }
        };
        
        const reportPath = path.join(this.packageDir, 'verification-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 Verification report saved to: ${reportPath}`);
    }

    printResults() {
        console.log('\n📊 Verification Results:');
        console.log(`✅ Passed: ${this.verificationResults.passed.length}`);
        console.log(`❌ Failed: ${this.verificationResults.failed.length}`);
        console.log(`⚠️ Warnings: ${this.verificationResults.warnings.length}`);
        
        if (this.verificationResults.failed.length > 0) {
            console.log('\n❌ Failed Items:');
            this.verificationResults.failed.forEach(item => {
                console.log(`  - ${item.type}: ${item.message}`);
            });
        }
        
        if (this.verificationResults.warnings.length > 0) {
            console.log('\n⚠️ Warnings:');
            this.verificationResults.warnings.forEach(item => {
                console.log(`  - ${item.type}: ${item.message}`);
            });
        }
        
        const overallStatus = this.verificationResults.failed.length === 0 ? 'PASSED' : 'FAILED';
        console.log(`\n🎯 Overall Status: ${overallStatus}`);
    }
}

// Run the verifier
if (require.main === module) {
    const verifier = new PackageVerifier();
    verifier.verifyPackage().catch(console.error);
}

module.exports = PackageVerifier;