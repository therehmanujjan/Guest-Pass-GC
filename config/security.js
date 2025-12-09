/**
 * Security Configuration and Validation
 * Comprehensive security measures for Guest Pass System
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class SecurityManager {
    constructor() {
        this.configPath = path.join(__dirname, 'security.json');
        this.secretsPath = path.join(__dirname, '.secrets');
        this.envPath = path.join(__dirname, '..', '.env');
        this.loadConfig();
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } else {
                this.config = this.getDefaultConfig();
                this.saveConfig();
            }
        } catch (error) {
            console.warn('Error loading security config:', error.message);
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            csp: {
                enabled: true,
                directives: {
                    'default-src': ["'self'"],
                    'script-src': ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
                    'style-src': ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                    'img-src': ["'self'", "data:", "https:"],
                    'font-src': ["'self'", "https://fonts.gstatic.com"],
                    'connect-src': ["'self'", "https://api.github.com"],
                    'frame-ancestors': ["'none'"],
                    'base-uri': ["'self'"],
                    'form-action': ["'self'"]
                }
            },
            cors: {
                enabled: true,
                origins: ['http://localhost:3000', 'https://your-domain.com'],
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
                credentials: true
            },
            rateLimit: {
                enabled: true,
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // limit each IP to 100 requests per windowMs
                message: 'Too many requests from this IP, please try again later.',
                standardHeaders: true,
                legacyHeaders: false
            },
            helmet: {
                enabled: true,
                options: {
                    contentSecurityPolicy: false, // We handle CSP separately
                    crossOriginEmbedderPolicy: false,
                    dnsPrefetchControl: true,
                    frameguard: { action: 'deny' },
                    hidePoweredBy: true,
                    hsts: {
                        maxAge: 31536000,
                        includeSubDomains: true,
                        preload: true
                    },
                    ieNoOpen: true,
                    noSniff: true,
                    originAgentCluster: true,
                    permittedCrossDomainPolicies: false,
                    referrerPolicy: { policy: 'no-referrer' },
                    xssFilter: true
                }
            },
            encryption: {
                algorithm: 'aes-256-gcm',
                keyLength: 32,
                ivLength: 16,
                saltLength: 64,
                tagLength: 16
            },
            hashing: {
                algorithm: 'sha256',
                saltLength: 32,
                iterations: 100000
            },
            session: {
                secretLength: 64,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                secure: true,
                httpOnly: true,
                sameSite: 'strict'
            },
            validation: {
                maxInputLength: 1000,
                allowedTags: [],
                allowedAttributes: [],
                sanitizeHtml: true
            }
        };
    }

    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving security config:', error.message);
        }
    }

    // Encryption methods
    generateKey(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    generateIV(length = 16) {
        return crypto.randomBytes(length);
    }

    generateSalt(length = 32) {
        return crypto.randomBytes(length);
    }

    encrypt(text, key = null) {
        try {
            const encryptionKey = key || this.getEncryptionKey();
            const iv = this.generateIV();
            const cipher = crypto.createCipher(this.config.encryption.algorithm, encryptionKey);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const tag = cipher.getAuthTag();
            
            return {
                encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex')
            };
        } catch (error) {
            console.error('Encryption error:', error.message);
            throw error;
        }
    }

    decrypt(encryptedData, key = null) {
        try {
            const encryptionKey = key || this.getEncryptionKey();
            const decipher = crypto.createDecipher(
                this.config.encryption.algorithm,
                encryptionKey
            );
            
            decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error.message);
            throw error;
        }
    }

    // Hashing methods
    hash(text, salt = null) {
        try {
            const saltBuffer = salt || this.generateSalt();
            const hash = crypto.pbkdf2Sync(
                text,
                saltBuffer,
                this.config.hashing.iterations,
                this.config.hashing.saltLength,
                this.config.hashing.algorithm
            );
            
            return {
                hash: hash.toString('hex'),
                salt: saltBuffer.toString('hex')
            };
        } catch (error) {
            console.error('Hashing error:', error.message);
            throw error;
        }
    }

    verifyHash(text, hash, salt) {
        try {
            const result = this.hash(text, Buffer.from(salt, 'hex'));
            return result.hash === hash;
        } catch (error) {
            console.error('Hash verification error:', error.message);
            return false;
        }
    }

    // Session management
    generateSessionSecret() {
        return this.generateKey(this.config.session.secretLength);
    }

    // Input validation
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        if (input.length > this.config.validation.maxInputLength) {
            throw new Error('Input exceeds maximum length');
        }

        if (this.config.validation.sanitizeHtml) {
            // Basic HTML sanitization
            input = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            input = input.replace(/javascript:/gi, '');
            input = input.replace(/on\w+\s*=/gi, '');
        }

        return input.trim();
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    validatePhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone) && phone.length <= 20;
    }

    validateVisitorId(id) {
        const idRegex = /^[A-Z0-9]{6,12}$/;
        return idRegex.test(id);
    }

    // Environment and secrets management
    getEncryptionKey() {
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            throw new Error('ENCRYPTION_KEY environment variable not set');
        }
        return key;
    }

    getSessionSecret() {
        const secret = process.env.SESSION_SECRET;
        if (!secret) {
            throw new Error('SESSION_SECRET environment variable not set');
        }
        return secret;
    }

    generateEnvFile() {
        const envContent = `# Guest Pass System Environment Variables
# Generated on ${new Date().toISOString()}

# Security Keys (Generate new ones for production)
ENCRYPTION_KEY=${this.generateKey()}
SESSION_SECRET=${this.generateSessionSecret()}
JWT_SECRET=${this.generateKey(64)}

# Application Settings
NODE_ENV=production
PORT=3000
HOST=localhost

# Security Headers
CSP_ENABLED=true
CORS_ENABLED=true
RATE_LIMIT_ENABLED=true

# Database (if applicable)
# DATABASE_URL=your_database_connection_string

# External Services
# STRIPE_SECRET_KEY=your_stripe_secret_key
# SENDGRID_API_KEY=your_sendgrid_api_key

# Monitoring
# SENTRY_DSN=your_sentry_dsn
# LOG_LEVEL=info

# Domain Settings
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
TRUSTED_PROXIES=127.0.0.1

# Session Settings
SESSION_MAX_AGE=86400000
SESSION_SECURE=true

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf

# QR Code Settings
QR_CODE_SIZE=200
QR_CODE_MARGIN=2
QR_CODE_ERROR_LEVEL=M
`;

        try {
            fs.writeFileSync(this.envPath, envContent, 'utf8');
            console.log('✓ Environment file generated:', this.envPath);
            return true;
        } catch (error) {
            console.error('Error generating environment file:', error.message);
            return false;
        }
    }

    // CSP Header generation
    generateCSPHeader() {
        if (!this.config.csp.enabled) {
            return null;
        }

        const directives = [];
        for (const [directive, values] of Object.entries(this.config.csp.directives)) {
            directives.push(`${directive} ${values.join(' ')}`);
        }

        return directives.join('; ');
    }

    // CORS configuration
    getCORSConfig() {
        if (!this.config.cors.enabled) {
            return null;
        }

        return {
            origin: this.config.cors.origins,
            methods: this.config.cors.methods,
            allowedHeaders: this.config.cors.headers,
            credentials: this.config.cors.credentials,
            optionsSuccessStatus: 200
        };
    }

    // Security headers
    getSecurityHeaders() {
        const headers = {};

        // CSP Header
        const cspHeader = this.generateCSPHeader();
        if (cspHeader) {
            headers['Content-Security-Policy'] = cspHeader;
        }

        // Additional security headers
        headers['X-Content-Type-Options'] = 'nosniff';
        headers['X-Frame-Options'] = 'DENY';
        headers['X-XSS-Protection'] = '1; mode=block';
        headers['Referrer-Policy'] = 'no-referrer';
        headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()';

        return headers;
    }

    // Input sanitization for visitor data
    sanitizeVisitorData(data) {
        const sanitized = {};
        
        const stringFields = ['name', 'email', 'phone', 'company', 'purpose', 'host'];
        const dateFields = ['checkIn', 'checkOut'];
        const idFields = ['visitorId'];

        for (const field of stringFields) {
            if (data[field]) {
                sanitized[field] = this.sanitizeInput(data[field]);
            }
        }

        for (const field of dateFields) {
            if (data[field]) {
                const date = new Date(data[field]);
                if (!isNaN(date.getTime())) {
                    sanitized[field] = date.toISOString();
                }
            }
        }

        for (const field of idFields) {
            if (data[field] && this.validateVisitorId(data[field])) {
                sanitized[field] = data[field].toUpperCase();
            }
        }

        return sanitized;
    }

    // Security audit
    auditSecurity() {
        const audit = {
            timestamp: new Date().toISOString(),
            status: 'PASS',
            issues: [],
            recommendations: []
        };

        // Check environment variables
        const requiredEnvVars = [
            'ENCRYPTION_KEY',
            'SESSION_SECRET',
            'NODE_ENV'
        ];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                audit.issues.push(`Missing environment variable: ${envVar}`);
                audit.status = 'FAIL';
            }
        }

        // Check security headers
        if (!this.config.helmet.enabled) {
            audit.issues.push('Helmet security headers not enabled');
            audit.status = 'FAIL';
        }

        if (!this.config.csp.enabled) {
            audit.recommendations.push('Enable Content Security Policy (CSP)');
        }

        if (!this.config.rateLimit.enabled) {
            audit.recommendations.push('Enable rate limiting');
        }

        // Check encryption settings
        if (this.config.encryption.algorithm !== 'aes-256-gcm') {
            audit.recommendations.push('Consider using AES-256-GCM for encryption');
        }

        if (this.config.hashing.iterations < 10000) {
            audit.recommendations.push('Increase hashing iterations for better security');
        }

        return audit;
    }
}

// Export for use in other modules
module.exports = SecurityManager;

// CLI interface
if (require.main === module) {
    const security = new SecurityManager();
    const command = process.argv[2];

    switch (command) {
        case 'generate-env':
            security.generateEnvFile();
            break;
        case 'audit':
            const audit = security.auditSecurity();
            console.log('\n🔒 Security Audit Report');
            console.log('========================');
            console.log(`Status: ${audit.status}`);
            console.log(`Timestamp: ${audit.timestamp}`);
            
            if (audit.issues.length > 0) {
                console.log('\n❌ Issues:');
                audit.issues.forEach(issue => console.log(`  - ${issue}`));
            }
            
            if (audit.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                audit.recommendations.forEach(rec => console.log(`  - ${rec}`));
            }
            
            if (audit.status === 'PASS') {
                console.log('\n✅ All security checks passed!');
            }
            break;
        case 'generate-keys':
            console.log('Generated Keys:');
            console.log(`ENCRYPTION_KEY=${security.generateKey()}`);
            console.log(`SESSION_SECRET=${security.generateSessionSecret()}`);
            console.log(`JWT_SECRET=${security.generateKey(64)}`);
            break;
        default:
            console.log('Usage: node security.js [command]');
            console.log('Commands:');
            console.log('  generate-env  - Generate .env file with security keys');
            console.log('  audit         - Run security audit');
            console.log('  generate-keys - Generate new security keys');
    }
}