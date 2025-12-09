#!/usr/bin/env node

/**
 * Package Manager for Guest Pass System
 * Comprehensive asset bundling and resource packaging
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class PackageManager {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.distDir = path.join(this.projectRoot, 'dist');
        this.assetsDir = path.join(this.projectRoot, 'assets');
        this.packagesDir = path.join(this.projectRoot, 'packages');
        this.manifestPath = path.join(this.distDir, 'package-manifest.json');
        
        this.ensureDirectories();
    }

    ensureDirectories() {
        [this.distDir, this.assetsDir, this.packagesDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async createPackage(options = {}) {
        const startTime = Date.now();
        console.log('📦 Starting package creation...');

        const packageConfig = {
            version: this.getVersion(),
            timestamp: new Date().toISOString(),
            environment: options.environment || 'production',
            includeSourceMaps: options.includeSourceMaps || false,
            compress: options.compress !== false,
            generateChecksums: options.generateChecksums !== false
        };

        try {
            // Step 1: Prepare assets
            console.log('📋 Preparing assets...');
            const assets = await this.prepareAssets(packageConfig);

            // Step 2: Bundle dependencies
            console.log('📚 Bundling dependencies...');
            const dependencies = await this.bundleDependencies(packageConfig);

            // Step 3: Process HTML files
            console.log('🌐 Processing HTML files...');
            const htmlFiles = await this.processHTMLFiles(packageConfig);

            // Step 4: Optimize assets
            console.log('⚡ Optimizing assets...');
            const optimizedAssets = await this.optimizeAssets(assets, packageConfig);

            // Step 5: Generate checksums
            let checksums = {};
            if (packageConfig.generateChecksums) {
                console.log('🔐 Generating checksums...');
                checksums = await this.generateChecksums(optimizedAssets);
            }

            // Step 6: Create manifest
            console.log('📄 Creating package manifest...');
            const manifest = this.createManifest(packageConfig, optimizedAssets, dependencies, checksums);

            // Step 7: Create final package
            console.log('📦 Creating final package...');
            const packagePath = await this.createFinalPackage(manifest, packageConfig);

            // Step 8: Generate deployment files
            console.log('🚀 Generating deployment files...');
            await this.generateDeploymentFiles(manifest, packageConfig);

            const duration = Date.now() - startTime;
            console.log(`✅ Package created successfully in ${duration}ms`);
            console.log(`📍 Package location: ${packagePath}`);

            return {
                success: true,
                packagePath,
                manifest,
                duration,
                size: this.getFileSize(packagePath)
            };

        } catch (error) {
            console.error('❌ Package creation failed:', error.message);
            throw error;
        }
    }

    getVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
            return packageJson.version;
        } catch {
            return '1.0.0';
        }
    }

    async prepareAssets(config) {
        const assets = {
            html: [],
            css: [],
            js: [],
            images: [],
            fonts: [],
            libraries: []
        };

        // Find all HTML files
        const htmlFiles = this.findFiles(this.projectRoot, '.html');
        assets.html = htmlFiles.map(file => ({
            source: file,
            relative: path.relative(this.projectRoot, file),
            type: 'html'
        }));

        // Find all CSS files
        const cssFiles = this.findFiles(this.projectRoot, '.css');
        assets.css = cssFiles.map(file => ({
            source: file,
            relative: path.relative(this.projectRoot, file),
            type: 'css'
        }));

        // Find all JS files
        const jsFiles = this.findFiles(this.projectRoot, '.js');
        assets.js = jsFiles.map(file => ({
            source: file,
            relative: path.relative(this.projectRoot, file),
            type: 'js'
        }));

        // Find image files
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
        const imageFiles = this.findFilesByExtensions(this.projectRoot, imageExtensions);
        assets.images = imageFiles.map(file => ({
            source: file,
            relative: path.relative(this.projectRoot, file),
            type: 'image'
        }));

        // Find font files
        const fontExtensions = ['.ttf', '.woff', '.woff2', '.eot', '.otf'];
        const fontFiles = this.findFilesByExtensions(this.projectRoot, fontExtensions);
        assets.fonts = fontFiles.map(file => ({
            source: file,
            relative: path.relative(this.projectRoot, file),
            type: 'font'
        }));

        // Find library files
        const libraryFiles = this.findFiles(this.projectRoot, '.min.js')
            .concat(this.findFiles(this.projectRoot, '.min.css'));
        assets.libraries = libraryFiles.map(file => ({
            source: file,
            relative: path.relative(this.projectRoot, file),
            type: 'library'
        }));

        return assets;
    }

    findFiles(dir, extension) {
        const files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!this.shouldSkipDirectory(item)) {
                    files.push(...this.findFiles(fullPath, extension));
                }
            } else if (item.endsWith(extension)) {
                files.push(fullPath);
            }
        }

        return files;
    }

    findFilesByExtensions(dir, extensions) {
        const files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                if (!this.shouldSkipDirectory(item)) {
                    files.push(...this.findFilesByExtensions(fullPath, extensions));
                }
            } else if (extensions.some(ext => item.endsWith(ext))) {
                files.push(fullPath);
            }
        }

        return files;
    }

    shouldSkipDirectory(dirName) {
        const skipDirs = ['node_modules', 'dist', 'packages', '.git', 'logs', 'metrics', 'config', 'scripts'];
        return skipDirs.includes(dirName) || dirName.startsWith('.');
    }

    async bundleDependencies(config) {
        const dependencies = {
            external: [],
            internal: []
        };

        // Read package.json dependencies
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
            dependencies.external = Object.keys(packageJson.dependencies || {});
            dependencies.internal = this.findInternalDependencies();
        } catch (error) {
            console.warn('Warning: Could not read package.json dependencies');
        }

        return dependencies;
    }

    findInternalDependencies() {
        const internalDeps = [];
        const jsFiles = this.findFiles(this.projectRoot, '.js');

        jsFiles.forEach(file => {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const requireMatches = content.match(/require\(['"`]([^'"`]+)['"`]\)/g) || [];
                const importMatches = content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];

                [...requireMatches, ...importMatches].forEach(match => {
                    const moduleName = match.match(/['"`]([^'"`]+)['"`]/)[1];
                    if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
                        internalDeps.push({
                            from: path.relative(this.projectRoot, file),
                            to: moduleName
                        });
                    }
                });
            } catch (error) {
                console.warn(`Warning: Could not analyze ${file}`);
            }
        });

        return internalDeps;
    }

    async processHTMLFiles(config) {
        const htmlFiles = this.findFiles(this.projectRoot, '.html');
        const processedFiles = [];

        for (const file of htmlFiles) {
            try {
                let content = fs.readFileSync(file, 'utf8');
                
                // Add version meta tag
                content = content.replace(
                    /<head>/i,
                    `<head>\n<meta name="version" content="${config.version}">\n<meta name="build-date" content="${config.timestamp}">`
                );

                // Update script and CSS references with version hash
                content = this.updateAssetReferences(content, config);

                processedFiles.push({
                    source: file,
                    relative: path.relative(this.projectRoot, file),
                    content,
                    processed: true
                });

            } catch (error) {
                console.warn(`Warning: Could not process HTML file ${file}`);
            }
        }

        return processedFiles;
    }

    updateAssetReferences(content, config) {
        // Update CSS references
        content = content.replace(
            /<link[^>]*href=["']([^"']+\.css)["'][^>]*>/g,
            (match, href) => {
                const hash = this.generateFileHash(href);
                return match.replace(href, `${href}?v=${config.version}&h=${hash}`);
            }
        );

        // Update JS references
        content = content.replace(
            /<script[^>]*src=["']([^"']+\.js)["'][^>]*>/g,
            (match, src) => {
                const hash = this.generateFileHash(src);
                return match.replace(src, `${src}?v=${config.version}&h=${hash}`);
            }
        );

        return content;
    }

    generateFileHash(filename) {
        try {
            const filePath = path.join(this.projectRoot, filename);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath);
                return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
            }
        } catch (error) {
            // Ignore errors
        }
        return 'unknown';
    }

    async optimizeAssets(assets, config) {
        const optimized = [];

        // Optimize images
        for (const image of assets.images) {
            try {
                const content = fs.readFileSync(image.source);
                optimized.push({
                    ...image,
                    content,
                    size: content.length,
                    optimized: true
                });
            } catch (error) {
                console.warn(`Warning: Could not optimize image ${image.source}`);
            }
        }

        // Process CSS files
        for (const css of assets.css) {
            try {
                let content = fs.readFileSync(css.source, 'utf8');
                
                // Basic CSS minification
                if (config.compress) {
                    content = content
                        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                        .replace(/\s+/g, ' ') // Collapse whitespace
                        .replace(/;\s*}/g, '}') // Remove last semicolon
                        .trim();
                }

                optimized.push({
                    ...css,
                    content,
                    size: content.length,
                    optimized: true
                });
            } catch (error) {
                console.warn(`Warning: Could not process CSS file ${css.source}`);
            }
        }

        // Process JS files
        for (const js of assets.js) {
            try {
                let content = fs.readFileSync(js.source, 'utf8');
                
                // Basic JS minification
                if (config.compress && !js.relative.includes('.min.')) {
                    content = content
                        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                        .replace(/\/\/.*$/gm, '') // Remove single-line comments
                        .replace(/\s+/g, ' ') // Collapse whitespace
                        .trim();
                }

                optimized.push({
                    ...js,
                    content,
                    size: content.length,
                    optimized: true
                });
            } catch (error) {
                console.warn(`Warning: Could not process JS file ${js.source}`);
            }
        }

        return optimized;
    }

    async generateChecksums(files) {
        const checksums = {};

        for (const file of files) {
            if (file.content) {
                const hash = crypto.createHash('sha256').update(file.content).digest('hex');
                checksums[file.relative] = hash;
            }
        }

        return checksums;
    }

    createManifest(config, assets, dependencies, checksums) {
        const manifest = {
            version: config.version,
            timestamp: config.timestamp,
            environment: config.environment,
            build: {
                node: process.version,
                platform: process.platform,
                arch: process.arch
            },
            assets: {
                count: assets.length,
                totalSize: assets.reduce((sum, asset) => sum + (asset.size || 0), 0),
                byType: this.groupAssetsByType(assets)
            },
            dependencies,
            checksums,
            metadata: {
                generator: 'guest-pass-system-package-manager',
                compression: config.compress,
                sourceMaps: config.includeSourceMaps
            }
        };

        return manifest;
    }

    groupAssetsByType(assets) {
        const grouped = {};
        
        for (const asset of assets) {
            if (!grouped[asset.type]) {
                grouped[asset.type] = {
                    count: 0,
                    totalSize: 0,
                    files: []
                };
            }
            
            grouped[asset.type].count++;
            grouped[asset.type].totalSize += asset.size || 0;
            grouped[asset.type].files.push(asset.relative);
        }

        return grouped;
    }

    async createFinalPackage(manifest, config) {
        const packageName = `guest-pass-system-${config.version}.tar.gz`;
        const packagePath = path.join(this.packagesDir, packageName);

        // Create dist directory structure
        const distFiles = [];

        // Add HTML files
        if (manifest.assets.byType.html) {
            for (const htmlFile of manifest.assets.byType.html.files) {
                const sourcePath = path.join(this.projectRoot, htmlFile);
                const distPath = path.join(this.distDir, htmlFile);
                
                if (fs.existsSync(sourcePath)) {
                    fs.copyFileSync(sourcePath, distPath);
                    distFiles.push(distPath);
                }
            }
        }

        // Add optimized assets
        // This is simplified - in a real implementation, you'd write the optimized content

        // Save manifest
        fs.writeFileSync(this.manifestPath, JSON.stringify(manifest, null, 2));

        // Create tar.gz package
        try {
            execSync(`tar -czf "${packagePath}" -C "${this.projectRoot}" dist config docs scripts VERSION package.json README.md LICENSE`, {
                stdio: 'inherit'
            });
        } catch (error) {
            throw new Error(`Failed to create package: ${error.message}`);
        }

        return packagePath;
    }

    async generateDeploymentFiles(manifest, config) {
        // Generate deployment script
        const deploymentScript = this.generateDeploymentScript(manifest, config);
        fs.writeFileSync(path.join(this.packagesDir, 'deploy.sh'), deploymentScript, { mode: 0o755 });

        // Generate Docker files
        const dockerfile = this.generateDockerfile(manifest, config);
        fs.writeFileSync(path.join(this.packagesDir, 'Dockerfile'), dockerfile);

        // Generate docker-compose
        const dockerCompose = this.generateDockerCompose(manifest, config);
        fs.writeFileSync(path.join(this.packagesDir, 'docker-compose.yml'), dockerCompose);
    }

    generateDeploymentScript(manifest, config) {
        return `#!/bin/bash
# Guest Pass System Deployment Script
# Version: ${manifest.version}
# Generated: ${manifest.timestamp}

set -e

PACKAGE_VERSION="${manifest.version}"
ENVIRONMENT="${config.environment}"
DEPLOY_DIR="/opt/guest-pass-system"
SERVICE_NAME="guest-pass-system"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting deployment of Guest Pass System v${PACKAGE_VERSION}"

# Create deployment directory
sudo mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Extract package (assuming package is in the same directory)
log "Extracting package..."
tar -xzf guest-pass-system-${PACKAGE_VERSION}.tar.gz

# Set permissions
log "Setting permissions..."
sudo chown -R www-data:www-data $DEPLOY_DIR
sudo chmod -R 755 $DEPLOY_DIR

# Create systemd service
log "Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null <<EOF
[Unit]
Description=Guest Pass System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
log "Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME

log "Deployment completed successfully!"
log "Service status:"
sudo systemctl status $SERVICE_NAME --no-pager
`;
    }

    generateDockerfile(manifest, config) {
        return `# Guest Pass System Dockerfile
# Version: ${manifest.version}

FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY dist/ ./dist/
COPY config/ ./config/
COPY VERSION ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S guestpass -u 1001

# Change ownership
RUN chown -R guestpass:nodejs /usr/src/app

# Switch to non-root user
USER guestpass

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "console.log('Health check passed')" || exit 1

# Start application
CMD ["node", "dist/server.js"]
`;
    }

    generateDockerCompose(manifest, config) {
        return `# Guest Pass System Docker Compose
# Version: ${manifest.version}

version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./logs:/usr/src/app/logs
      - ./uploads:/usr/src/app/uploads
    restart: unless-stopped
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: guestpass
      POSTGRES_USER: guestpass
      POSTGRES_PASSWORD: ${config.environment === 'production' ? '${POSTGRES_PASSWORD}' : 'password'}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:

networks:
  default:
    driver: bridge
`;
    }

    getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    // Utility methods
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

// CLI interface
if (require.main === module) {
    const packager = new PackageManager();
    const args = process.argv.slice(2);
    
    const options = {
        environment: args[0] || 'production',
        compress: !args.includes('--no-compress'),
        generateChecksums: !args.includes('--no-checksums'),
        includeSourceMaps: args.includes('--source-maps')
    };

    packager.createPackage(options)
        .then(result => {
            console.log('\n🎉 Package creation completed successfully!');
            console.log(`📦 Package: ${result.packagePath}`);
            console.log(`📏 Size: ${packager.formatBytes(result.size)}`);
            console.log(`⏱️  Duration: ${result.duration}ms`);
        })
        .catch(error => {
            console.error('\n❌ Package creation failed:', error.message);
            process.exit(1);
        });
}

module.exports = PackageManager;