#!/usr/bin/env node

/**
 * Asset Packaging Script
 * Packages all assets and resources for deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class AssetPackager {
    constructor() {
        this.packageDir = path.join(__dirname, '..', 'package');
        this.assetsDir = path.join(this.packageDir, 'assets');
        this.resourcesDir = path.join(this.packageDir, 'resources');
        this.manifest = {
            version: require('../package.json').version,
            buildTime: new Date().toISOString(),
            assets: {},
            resources: {},
            checksums: {}
        };
    }

    async packageAll() {
        console.log('📦 Starting asset packaging process...');
        
        try {
            // Clean and create package directory
            this.cleanPackageDir();
            
            // Package core application files
            await this.packageCoreFiles();
            
            // Package JavaScript libraries
            await this.packageJavaScriptLibraries();
            
            // Package CSS and styling assets
            await this.packageStylingAssets();
            
            // Package documentation
            await this.packageDocumentation();
            
            // Package configuration files
            await this.packageConfigurationFiles();
            
            // Package database assets
            await this.packageDatabaseAssets();
            
            // Package deployment assets
            await this.packageDeploymentAssets();
            
            // Generate manifest and checksums
            await this.generateManifest();
            
            // Create compressed archives
            await this.createArchives();
            
            console.log('✅ Asset packaging completed successfully!');
            console.log(`📊 Total assets packaged: ${Object.keys(this.manifest.assets).length}`);
            console.log(`📁 Package location: ${this.packageDir}`);
            
        } catch (error) {
            console.error('❌ Asset packaging failed:', error.message);
            process.exit(1);
        }
    }

    cleanPackageDir() {
        console.log('🧹 Cleaning package directory...');
        
        if (fs.existsSync(this.packageDir)) {
            fs.rmSync(this.packageDir, { recursive: true, force: true });
        }
        
        fs.mkdirSync(this.packageDir, { recursive: true });
        fs.mkdirSync(this.assetsDir, { recursive: true });
        fs.mkdirSync(this.resourcesDir, { recursive: true });
        fs.mkdirSync(path.join(this.assetsDir, 'js'), { recursive: true });
        fs.mkdirSync(path.join(this.assetsDir, 'css'), { recursive: true });
        fs.mkdirSync(path.join(this.assetsDir, 'images'), { recursive: true });
        fs.mkdirSync(path.join(this.resourcesDir, 'docs'), { recursive: true });
        fs.mkdirSync(path.join(this.resourcesDir, 'config'), { recursive: true });
        fs.mkdirSync(path.join(this.resourcesDir, 'database'), { recursive: true });
        fs.mkdirSync(path.join(this.resourcesDir, 'deployment'), { recursive: true });
    }

    async packageCoreFiles() {
        console.log('📄 Packaging core application files...');
        
        const coreFiles = [
            'guest-pass-system.html',
            'guest-pass-system-clean.html',
            'guest-pass-system-complete.html',
            'shared-guest-pass-system.html',
            'complete-guest-pass-system.html'
        ];

        for (const file of coreFiles) {
            console.log('Processing core file:', file);
            const sourcePath = path.join(__dirname, '..', file);
            if (fs.existsSync(sourcePath)) {
                try {
                    const targetPath = path.join(this.assetsDir, file);
                    fs.copyFileSync(sourcePath, targetPath);
                    this.manifest.assets[file] = {
                        type: 'core-application',
                        size: fs.statSync(sourcePath).size,
                        path: `assets/${file}`
                    };
                    console.log('✅ Copied core file:', file);
                } catch (error) {
                    console.error(`Error copying core file ${file}:`, error.message);
                    throw error;
                }
            } else {
                console.log('⚠️ Core file not found:', file);
            }
        }
    }

    async packageJavaScriptLibraries() {
        console.log('📚 Packaging JavaScript libraries...');
        
        const libraries = [
            'babel.min.js',
            'react.production.min.js',
            'react-dom.production.min.js',
            'qrcode.min.js',
            'html2canvas.min.js',
            'jsQR.js',
            'supabase.min.js',
            'tailwindcss.js'
        ];

        for (const lib of libraries) {
            console.log('Processing library:', lib);
            const sourcePath = path.join(__dirname, '..', lib);
            if (fs.existsSync(sourcePath)) {
                try {
                    const targetPath = path.join(this.assetsDir, 'js', lib);
                    fs.copyFileSync(sourcePath, targetPath);
                    this.manifest.assets[lib] = {
                        type: 'javascript-library',
                        size: fs.statSync(sourcePath).size,
                        path: `assets/js/${lib}`
                    };
                    console.log('✅ Copied:', lib);
                } catch (error) {
                    console.error(`Error copying ${lib}:`, error.message);
                    throw error;
                }
            } else {
                console.log('⚠️ Library not found:', lib);
            }
        }
    }

    async packageStylingAssets() {
        console.log('🎨 Packaging styling assets...');
        
        try {
            // Extract CSS from HTML files and create standalone CSS files
            const htmlFiles = fs.readdirSync(path.join(__dirname, '..'))
                .filter(file => file.endsWith('.html') && file.includes('guest-pass'));

            console.log('Found HTML files:', htmlFiles);

            for (const htmlFile of htmlFiles) {
                console.log('Processing:', htmlFile);
                const htmlPath = path.join(__dirname, '..', htmlFile);
                
                try {
                    const content = fs.readFileSync(htmlPath, 'utf8');
                    
                    // Extract Tailwind classes and create CSS bundle
                    const cssContent = this.extractCSSFromHTML(content);
                    if (cssContent) {
                        const cssFileName = htmlFile.replace('.html', '.css');
                        const cssPath = path.join(this.assetsDir, 'css', cssFileName);
                        fs.writeFileSync(cssPath, cssContent, 'utf8');
                        this.manifest.assets[cssFileName] = {
                            type: 'stylesheet',
                            size: Buffer.byteLength(cssContent, 'utf8'),
                            path: `assets/css/${cssFileName}`
                        };
                    }
                } catch (error) {
                    console.error(`Error processing ${htmlFile}:`, error.message);
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error in packageStylingAssets:', error.message);
            throw error;
        }
    }

    extractCSSFromHTML(htmlContent) {
        // Extract style tags and inline styles
        const styleMatches = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        let cssContent = '';
        
        if (styleMatches) {
            styleMatches.forEach(match => {
                const css = match.replace(/<style[^>]*>([\s\S]*?)<\/style>/i, '$1');
                cssContent += css + '\n';
            });
        }
        
        return cssContent.trim() || null;
    }

    async packageDocumentation() {
        console.log('📖 Packaging documentation...');
        
        const docFiles = [
            'README.md',
            'DEPLOYMENT.md',
            'USER_TRAINING_GUIDE.md',
            'api-documentation.md',
            'database-schema.md',
            'security-rbac.md',
            'technical-specifications.md',
            'technical-specifications-detailed.md',
            'guest-pass-system-overview.md',
            'ui-ux-wireframes.md',
            'implementation-roadmap.md',
            'feature-matrix-analysis.md',
            'test-results.md'
        ];

        for (const doc of docFiles) {
            const sourcePath = path.join(__dirname, '..', doc);
            if (fs.existsSync(sourcePath)) {
                const targetPath = path.join(this.resourcesDir, 'docs', doc);
                fs.copyFileSync(sourcePath, targetPath);
                this.manifest.resources[doc] = {
                    type: 'documentation',
                    size: fs.statSync(sourcePath).size,
                    path: `resources/docs/${doc}`
                };
            }
        }
    }

    async packageConfigurationFiles() {
        console.log('⚙️ Packaging configuration files...');
        
        const configFiles = [
            'package.json',
            'vercel.json',
            'webpack.config.js',
            'docker-compose.yml',
            'Dockerfile',
            '.versionrc',
            '.gitignore'
        ];

        // Environment files
        const envFiles = ['.env.example', '.env.development', '.env.staging', '.env.production'];
        
        for (const file of [...configFiles, ...envFiles]) {
            const sourcePath = path.join(__dirname, '..', file);
            if (fs.existsSync(sourcePath)) {
                const targetPath = path.join(this.resourcesDir, 'config', file);
                fs.copyFileSync(sourcePath, targetPath);
                this.manifest.resources[file] = {
                    type: 'configuration',
                    size: fs.statSync(sourcePath).size,
                    path: `resources/config/${file}`
                };
            }
        }
    }

    async packageDatabaseAssets() {
        console.log('🗄️ Packaging database assets...');
        
        const dbFiles = [
            'database_schema.sql',
            'supabase/migrations/001_create_shared_tables.sql',
            'supabase/migrations/002_create_guestpass_schema.sql',
            'supabase/migrations/003_move_to_public_schema.sql'
        ];

        for (const file of dbFiles) {
            const sourcePath = path.join(__dirname, '..', file);
            if (fs.existsSync(sourcePath)) {
                const targetPath = path.join(this.resourcesDir, 'database', path.basename(file));
                fs.copyFileSync(sourcePath, targetPath);
                this.manifest.resources[path.basename(file)] = {
                    type: 'database',
                    size: fs.statSync(sourcePath).size,
                    path: `resources/database/${path.basename(file)}`
                };
            }
        }
    }

    async packageDeploymentAssets() {
        console.log('🚀 Packaging deployment assets...');
        
        const deploymentFiles = [
            'deploy.sh',
            'deploy-shared.sh',
            'deploy-production.sh',
            'server.js',
            'server-shared.js',
            'server-prod.js',
            'server-shared-prod.js'
        ];

        for (const file of deploymentFiles) {
            const sourcePath = path.join(__dirname, '..', file);
            if (fs.existsSync(sourcePath)) {
                const targetPath = path.join(this.resourcesDir, 'deployment', file);
                fs.copyFileSync(sourcePath, targetPath);
                this.manifest.resources[file] = {
                    type: 'deployment-script',
                    size: fs.statSync(sourcePath).size,
                    path: `resources/deployment/${file}`
                };
            }
        }
    }

    async generateManifest() {
        console.log('📋 Generating manifest and checksums...');
        
        // Generate checksums for all files
        const allFiles = [...Object.keys(this.manifest.assets), ...Object.keys(this.manifest.resources)];
        
        for (const file of allFiles) {
            const filePath = path.join(this.packageDir, this.manifest.assets[file]?.path || this.manifest.resources[file]?.path);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath);
                const checksum = crypto.createHash('sha256').update(content).digest('hex');
                this.manifest.checksums[file] = checksum;
            }
        }
        
        // Write manifest file
        const manifestPath = path.join(this.packageDir, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(this.manifest, null, 2));
        
        console.log(`📊 Manifest generated with ${Object.keys(this.manifest.checksums).length} checksums`);
    }

    async createArchives() {
        console.log('📦 Creating compressed archives...');
        
        try {
            // Create tar.gz archive
            execSync(`cd ${this.packageDir} && tar -czf guest-pass-system-v${this.manifest.version}.tar.gz *`, {
                stdio: 'inherit'
            });
            
            // Create zip archive
            execSync(`cd ${this.packageDir} && zip -r guest-pass-system-v${this.manifest.version}.zip *`, {
                stdio: 'inherit'
            });
            
            console.log('✅ Archives created successfully');
            
        } catch (error) {
            console.warn('⚠️ Archive creation failed:', error.message);
        }
    }
}

// Run the packager
if (require.main === module) {
    const packager = new AssetPackager();
    packager.packageAll().catch(console.error);
}

module.exports = AssetPackager;