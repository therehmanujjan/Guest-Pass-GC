#!/usr/bin/env node

/**
 * Secrets Manager for Guest Pass System
 * Secure key generation, rotation, and management
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecretsManager {
    constructor() {
        this.secretsDir = path.join(__dirname, '..', 'config', 'secrets');
        this.backupDir = path.join(__dirname, '..', 'config', 'secrets-backup');
        this.envPath = path.join(__dirname, '..', '.env');
        this.envExamplePath = path.join(__dirname, '..', '.env.example');
        
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.secretsDir, this.backupDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
            }
        });
    }

    generateSecret(length = 64) {
        return crypto.randomBytes(length).toString('hex');
    }

    generateJWTSecret() {
        return this.generateSecret(64);
    }

    generateEncryptionKey() {
        return this.generateSecret(32);
    }

    generateSessionSecret() {
        return this.generateSecret(64);
    }

    generateAPIKey() {
        const prefix = 'gps_';
        const randomPart = crypto.randomBytes(32).toString('hex');
        return prefix + randomPart;
    }

    generateDatabasePassword() {
        const length = 24;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(crypto.randomInt(0, charset.length));
        }
        return password;
    }

    createSecretsBundle() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const bundle = {
            timestamp,
            secrets: {
                ENCRYPTION_KEY: this.generateEncryptionKey(),
                SESSION_SECRET: this.generateSessionSecret(),
                JWT_SECRET: this.generateJWTSecret(),
                API_KEY: this.generateAPIKey(),
                DATABASE_PASSWORD: this.generateDatabasePassword()
            },
            metadata: {
                version: '1.0',
                algorithm: 'aes-256-gcm',
                generatedBy: 'guest-pass-system-secrets-manager'
            }
        };

        return bundle;
    }

    saveSecretsBundle(bundle, environment = 'production') {
        const filename = `secrets-${environment}-${bundle.timestamp}.json`;
        const filepath = path.join(this.secretsDir, filename);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(bundle, null, 2), { mode: 0o600 });
            console.log(`✓ Secrets bundle saved: ${filename}`);
            return filepath;
        } catch (error) {
            console.error('Error saving secrets bundle:', error.message);
            throw error;
        }
    }

    loadSecretsBundle(filepath) {
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error loading secrets bundle:', error.message);
            throw error;
        }
    }

    generateEnvFile(secrets, environment = 'production') {
        const envContent = `# Guest Pass System Environment Configuration
# Generated on ${new Date().toISOString()}
# Environment: ${environment}
# WARNING: Keep this file secure and never commit to version control

# Application Settings
NODE_ENV=${environment}
PORT=3000
HOST=0.0.0.0

# Security Keys
ENCRYPTION_KEY=${secrets.ENCRYPTION_KEY}
SESSION_SECRET=${secrets.SESSION_SECRET}
JWT_SECRET=${secrets.JWT_SECRET}
API_KEY=${secrets.API_KEY}

# Database Configuration
DATABASE_URL=postgresql://guestpass:${secrets.DATABASE_PASSWORD}@localhost:5432/guestpass_${environment}
DATABASE_PASSWORD=${secrets.DATABASE_PASSWORD}

# Redis Configuration (if applicable)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=${this.generateSecret(32)}

# External Services
# STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
# SENDGRID_API_KEY=SG.your_sendgrid_api_key
# TWILIO_ACCOUNT_SID=your_twilio_account_sid
# TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Monitoring and Logging
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# LOG_LEVEL=info
# LOG_FORMAT=json

# Security Settings
CSP_ENABLED=true
CORS_ENABLED=true
RATE_LIMIT_ENABLED=true
SECURITY_HEADERS_ENABLED=true

# Domain and CORS Settings
ALLOWED_ORIGINS=${environment === 'development' ? 'http://localhost:3000' : 'https://your-domain.com'}
TRUSTED_PROXIES=127.0.0.1,::1

# Session Configuration
SESSION_MAX_AGE=86400000
SESSION_SECURE=${environment === 'production'}
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# File Upload Settings
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf
UPLOAD_DIR=uploads

# QR Code Settings
QR_CODE_SIZE=200
QR_CODE_MARGIN=2
QR_CODE_ERROR_LEVEL=M
QR_CODE_TYPE=image/png

# Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Backup Settings
BACKUP_ENABLED=true
BACKUP_INTERVAL=24h
BACKUP_RETENTION=30d
BACKUP_ENCRYPTION_KEY=${this.generateEncryptionKey()}

# Development Settings (only for development)
${environment === 'development' ? 'DEBUG=true\nVERBOSE_LOGGING=true\nMOCK_SERVICES=false' : ''}
`;

        try {
            fs.writeFileSync(this.envPath, envContent, { mode: 0o600 });
            console.log(`✓ Environment file generated: ${this.envPath}`);
            return this.envPath;
        } catch (error) {
            console.error('Error generating environment file:', error.message);
            throw error;
        }
    }

    generateEnvExample() {
        const exampleContent = `# Guest Pass System Environment Configuration Example
# Copy this file to .env and fill in your actual values
# WARNING: Never commit the actual .env file to version control

# Application Settings
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Security Keys (Generate using: node scripts/secrets-manager.js generate)
ENCRYPTION_KEY=your-64-character-hex-encryption-key-here-xxxxxxxxxxxxxxxx
SESSION_SECRET=your-64-character-hex-session-secret-here-xxxxxxxxxxxxxxxx
JWT_SECRET=your-128-character-hex-jwt-secret-here-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_KEY=your-api-key-here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DATABASE_PASSWORD=your-database-password

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# External Services (optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
SENDGRID_API_KEY=SG.your_sendgrid_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Monitoring and Logging (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
LOG_FORMAT=json

# Security Settings
CSP_ENABLED=true
CORS_ENABLED=true
RATE_LIMIT_ENABLED=true
SECURITY_HEADERS_ENABLED=true

# Domain and CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
TRUSTED_PROXIES=127.0.0.1,::1

# Session Configuration
SESSION_MAX_AGE=86400000
SESSION_SECURE=false
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# File Upload Settings
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf
UPLOAD_DIR=uploads

# QR Code Settings
QR_CODE_SIZE=200
QR_CODE_MARGIN=2
QR_CODE_ERROR_LEVEL=M
QR_CODE_TYPE=image/png

# Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Backup Settings
BACKUP_ENABLED=true
BACKUP_INTERVAL=24h
BACKUP_RETENTION=30d
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key

# Development Settings
DEBUG=false
VERBOSE_LOGGING=false
MOCK_SERVICES=false
`;

        try {
            fs.writeFileSync(this.envExamplePath, exampleContent, { mode: 0o644 });
            console.log(`✓ Environment example file generated: ${this.envExamplePath}`);
            return this.envExamplePath;
        } catch (error) {
            console.error('Error generating environment example file:', error.message);
            throw error;
        }
    }

    rotateSecrets(environment = 'production') {
        console.log(`🔄 Rotating secrets for ${environment} environment...`);
        
        // Create backup of current secrets
        this.backupCurrentSecrets(environment);
        
        // Generate new secrets bundle
        const newBundle = this.createSecretsBundle();
        
        // Save new bundle
        const bundlePath = this.saveSecretsBundle(newBundle, environment);
        
        // Generate new environment file
        this.generateEnvFile(newBundle.secrets, environment);
        
        console.log(`✓ Secrets rotation completed for ${environment}`);
        console.log(`  Bundle saved: ${bundlePath}`);
        console.log(`  Environment file updated: ${this.envPath}`);
        
        return {
            bundle: newBundle,
            bundlePath,
            envPath: this.envPath
        };
    }

    backupCurrentSecrets(environment) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `backup-secrets-${environment}-${timestamp}.json`;
        const backupPath = path.join(this.backupDir, backupFilename);
        
        if (fs.existsSync(this.envPath)) {
            try {
                const currentEnv = fs.readFileSync(this.envPath, 'utf8');
                const secrets = {};
                
                // Extract secrets from current .env file
                const lines = currentEnv.split('\n');
                lines.forEach(line => {
                    if (line.includes('ENCRYPTION_KEY=') || 
                        line.includes('SESSION_SECRET=') || 
                        line.includes('JWT_SECRET=') || 
                        line.includes('API_KEY=') ||
                        line.includes('DATABASE_PASSWORD=')) {
                        const [key, value] = line.split('=');
                        if (key && value) {
                            secrets[key.trim()] = value.trim();
                        }
                    }
                });
                
                if (Object.keys(secrets).length > 0) {
                    const backupData = {
                        timestamp,
                        environment,
                        secrets,
                        backedUpBy: 'secrets-manager'
                    };
                    
                    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), { mode: 0o600 });
                    console.log(`✓ Current secrets backed up: ${backupFilename}`);
                    return backupPath;
                }
            } catch (error) {
                console.warn('Warning: Could not backup current secrets:', error.message);
            }
        }
        
        return null;
    }

    listSecretsBundles() {
        try {
            const files = fs.readdirSync(this.secretsDir);
            const bundles = files
                .filter(file => file.startsWith('secrets-') && file.endsWith('.json'))
                .map(file => {
                    const filepath = path.join(this.secretsDir, file);
                    const stats = fs.statSync(filepath);
                    return {
                        filename: file,
                        path: filepath,
                        size: stats.size,
                        modified: stats.mtime
                    };
                })
                .sort((a, b) => b.modified - a.modified);
            
            return bundles;
        } catch (error) {
            console.error('Error listing secrets bundles:', error.message);
            return [];
        }
    }

    cleanupOldSecrets(keepCount = 5) {
        console.log(`🧹 Cleaning up old secrets bundles (keeping ${keepCount} most recent)...`);
        
        const bundles = this.listSecretsBundles();
        
        if (bundles.length <= keepCount) {
            console.log('No cleanup needed - insufficient bundles');
            return;
        }
        
        const toDelete = bundles.slice(keepCount);
        let deletedCount = 0;
        
        toDelete.forEach(bundle => {
            try {
                fs.unlinkSync(bundle.path);
                console.log(`  Deleted: ${bundle.filename}`);
                deletedCount++;
            } catch (error) {
                console.warn(`  Failed to delete: ${bundle.filename} - ${error.message}`);
            }
        });
        
        console.log(`✓ Cleaned up ${deletedCount} old secrets bundles`);
    }

    validateSecrets() {
        console.log('🔍 Validating current secrets...');
        
        if (!fs.existsSync(this.envPath)) {
            console.error('❌ No .env file found');
            return false;
        }
        
        try {
            const envContent = fs.readFileSync(this.envPath, 'utf8');
            const requiredSecrets = [
                'ENCRYPTION_KEY',
                'SESSION_SECRET',
                'JWT_SECRET',
                'API_KEY'
            ];
            
            const missingSecrets = [];
            requiredSecrets.forEach(secret => {
                if (!envContent.includes(`${secret}=`) || envContent.includes(`${secret}=your-`)) {
                    missingSecrets.push(secret);
                }
            });
            
            if (missingSecrets.length > 0) {
                console.error(`❌ Missing or invalid secrets: ${missingSecrets.join(', ')}`);
                return false;
            }
            
            console.log('✅ All secrets are valid');
            return true;
        } catch (error) {
            console.error('❌ Error validating secrets:', error.message);
            return false;
        }
    }

    // Security audit
    auditSecrets() {
        console.log('🔒 Auditing secrets security...');
        
        const issues = [];
        const recommendations = [];
        
        // Check file permissions
        try {
            const envStats = fs.statSync(this.envPath);
            if (envStats.mode & 0o077) {
                issues.push('.env file has overly permissive permissions');
                recommendations.push('Run: chmod 600 .env');
            }
        } catch (error) {
            issues.push('Could not check .env file permissions');
        }
        
        // Check for default/weak secrets
        try {
            const envContent = fs.readFileSync(this.envPath, 'utf8');
            const weakPatterns = [
                /password.*123/i,
                /admin.*password/i,
                /test.*key/i,
                /your.*here/i,
                /example/i
            ];
            
            weakPatterns.forEach(pattern => {
                if (pattern.test(envContent)) {
                    issues.push('Potential weak or default secrets detected');
                    recommendations.push('Generate new secrets using: node scripts/secrets-manager.js generate');
                }
            });
        } catch (error) {
            issues.push('Could not read .env file for audit');
        }
        
        // Check gitignore
        const gitignorePath = path.join(__dirname, '..', '.gitignore');
        try {
            const gitignore = fs.readFileSync(gitignorePath, 'utf8');
            if (!gitignore.includes('.env')) {
                issues.push('.env not in .gitignore');
                recommendations.push('Add .env to .gitignore');
            }
        } catch (error) {
            recommendations.push('Create .gitignore file and add .env');
        }
        
        return {
            issues,
            recommendations,
            status: issues.length === 0 ? 'SECURE' : 'NEEDS_ATTENTION'
        };
    }
}

// CLI Interface
if (require.main === module) {
    const manager = new SecretsManager();
    const command = process.argv[2];
    const environment = process.argv[3] || 'production';

    switch (command) {
        case 'generate':
            const bundle = manager.createSecretsBundle();
            const bundlePath = manager.saveSecretsBundle(bundle, environment);
            manager.generateEnvFile(bundle.secrets, environment);
            manager.generateEnvExample();
            console.log('\n✅ Secrets generation completed!');
            console.log(`Bundle saved: ${bundlePath}`);
            console.log(`Environment file: ${manager.envPath}`);
            break;

        case 'rotate':
            const result = manager.rotateSecrets(environment);
            console.log('\n✅ Secrets rotation completed!');
            console.log(`New bundle: ${result.bundlePath}`);
            break;

        case 'list':
            const bundles = manager.listSecretsBundles();
            console.log('\n📋 Secrets Bundles:');
            bundles.forEach(bundle => {
                console.log(`  ${bundle.filename} (${bundle.size} bytes, ${bundle.modified.toISOString()})`);
            });
            break;

        case 'cleanup':
            const keepCount = parseInt(process.argv[4]) || 5;
            manager.cleanupOldSecrets(keepCount);
            break;

        case 'validate':
            const isValid = manager.validateSecrets();
            process.exit(isValid ? 0 : 1);
            break;

        case 'audit':
            const audit = manager.auditSecrets();
            console.log('\n🔒 Secrets Security Audit:');
            console.log(`Status: ${audit.status}`);
            
            if (audit.issues.length > 0) {
                console.log('\nIssues:');
                audit.issues.forEach(issue => console.log(`  ❌ ${issue}`));
            }
            
            if (audit.recommendations.length > 0) {
                console.log('\nRecommendations:');
                audit.recommendations.forEach(rec => console.log(`  💡 ${rec}`));
            }
            
            if (audit.status === 'SECURE') {
                console.log('\n✅ All secrets security checks passed!');
            }
            break;

        default:
            console.log('Usage: node secrets-manager.js [command] [environment] [options]');
            console.log('\nCommands:');
            console.log('  generate [env]     - Generate new secrets bundle');
            console.log('  rotate [env]       - Rotate secrets (backup current, generate new)');
            console.log('  list               - List all secrets bundles');
            console.log('  cleanup [keep]     - Clean up old bundles (default keep 5)');
            console.log('  validate           - Validate current secrets');
            console.log('  audit              - Audit secrets security');
            console.log('\nExamples:');
            console.log('  node secrets-manager.js generate production');
            console.log('  node secrets-manager.js rotate staging');
            console.log('  node secrets-manager.js cleanup 3');
    }
}

module.exports = SecretsManager;