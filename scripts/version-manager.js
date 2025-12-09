#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class VersionManager {
    constructor() {
        this.packageJsonPath = path.join(__dirname, '..', 'package.json');
        this.versionFilePath = path.join(__dirname, '..', 'VERSION');
        this.changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
        this.gitTagPrefix = 'v';
    }

    getCurrentVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            return packageJson.version;
        } catch (error) {
            console.error('Error reading package.json:', error.message);
            return '1.0.0';
        }
    }

    parseVersion(version) {
        const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
        if (!match) {
            throw new Error(`Invalid version format: ${version}`);
        }
        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
            patch: parseInt(match[3]),
            prerelease: match[4] || null
        };
    }

    formatVersion(versionObj) {
        let version = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
        if (versionObj.prerelease) {
            version += `-${versionObj.prerelease}`;
        }
        return version;
    }

    bumpVersion(type, prereleaseId = null) {
        const currentVersion = this.getCurrentVersion();
        const versionObj = this.parseVersion(currentVersion);

        switch (type) {
            case 'major':
                versionObj.major += 1;
                versionObj.minor = 0;
                versionObj.patch = 0;
                versionObj.prerelease = null;
                break;
            case 'minor':
                versionObj.minor += 1;
                versionObj.patch = 0;
                versionObj.prerelease = null;
                break;
            case 'patch':
                versionObj.patch += 1;
                versionObj.prerelease = null;
                break;
            case 'prerelease':
                if (versionObj.prerelease) {
                    const prereleaseMatch = versionObj.prerelease.match(/^(.+?)\.(\d+)$/);
                    if (prereleaseMatch) {
                        const currentId = prereleaseMatch[1];
                        const currentNum = parseInt(prereleaseMatch[2]);
                        if (prereleaseId && prereleaseId !== currentId) {
                            versionObj.prerelease = `${prereleaseId}.0`;
                        } else {
                            versionObj.prerelease = `${currentId}.${currentNum + 1}`;
                        }
                    } else {
                        versionObj.prerelease = `${versionObj.prerelease}.1`;
                    }
                } else {
                    versionObj.prerelease = `${prereleaseId || 'alpha'}.0`;
                }
                break;
            default:
                throw new Error(`Invalid version bump type: ${type}`);
        }

        return this.formatVersion(versionObj);
    }

    updatePackageJson(version) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
            packageJson.version = version;
            
            // Update version in main HTML files
            const htmlFiles = [
                'guest-pass-system.html',
                'guest-pass-system-clean.html'
            ];
            
            htmlFiles.forEach(file => {
                const htmlPath = path.join(__dirname, '..', file);
                if (fs.existsSync(htmlPath)) {
                    let content = fs.readFileSync(htmlPath, 'utf8');
                    content = content.replace(
                        /<!-- Version: .* -->/g,
                        `<!-- Version: ${version} -->`
                    );
                    content = content.replace(
                        /window\.APP_VERSION = '.*';/g,
                        `window.APP_VERSION = '${version}';`
                    );
                    fs.writeFileSync(htmlPath, content, 'utf8');
                }
            });

            fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
            console.log(`✓ Updated package.json to version ${version}`);
            return true;
        } catch (error) {
            console.error('Error updating package.json:', error.message);
            return false;
        }
    }

    updateVersionFile(version) {
        try {
            const versionInfo = {
                version: version,
                buildDate: new Date().toISOString(),
                buildNumber: process.env.BUILD_NUMBER || 'local',
                commitHash: this.getGitCommitHash(),
                environment: process.env.NODE_ENV || 'development'
            };

            fs.writeFileSync(this.versionFilePath, JSON.stringify(versionInfo, null, 2) + '\n', 'utf8');
            console.log(`✓ Updated VERSION file`);
            return true;
        } catch (error) {
            console.error('Error updating VERSION file:', error.message);
            return false;
        }
    }

    getGitCommitHash() {
        try {
            return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
        } catch (error) {
            return 'unknown';
        }
    }

    generateBuildHash() {
        try {
            const buildDir = path.join(__dirname, '..', 'dist');
            if (!fs.existsSync(buildDir)) {
                return null;
            }

            const hash = crypto.createHash('sha256');
            const files = this.getAllFiles(buildDir);
            
            files.sort().forEach(file => {
                const content = fs.readFileSync(file);
                hash.update(content);
            });

            return hash.digest('hex').substring(0, 16);
        } catch (error) {
            console.error('Error generating build hash:', error.message);
            return null;
        }
    }

    getAllFiles(dir, files = []) {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                this.getAllFiles(fullPath, files);
            } else {
                files.push(fullPath);
            }
        });
        
        return files;
    }

    createGitTag(version) {
        try {
            const tagName = `${this.gitTagPrefix}${version}`;
            
            // Check if tag already exists
            try {
                execSync(`git rev-parse --verify ${tagName}`, { encoding: 'utf8' });
                console.log(`⚠ Tag ${tagName} already exists`);
                return false;
            } catch (e) {
                // Tag doesn't exist, proceed with creation
            }

            // Create annotated tag
            const message = `Release ${version}\n\nGenerated by version manager`;
            execSync(`git tag -a ${tagName} -m "${message}"`, { encoding: 'utf8' });
            
            console.log(`✓ Created git tag: ${tagName}`);
            return true;
        } catch (error) {
            console.error('Error creating git tag:', error.message);
            return false;
        }
    }

    updateChangelog(version, changes = []) {
        try {
            const date = new Date().toISOString().split('T')[0];
            let changelog = '';

            if (fs.existsSync(this.changelogPath)) {
                changelog = fs.readFileSync(this.changelogPath, 'utf8');
            }

            const newEntry = `## [${version}] - ${date}\n\n`;
            const changeList = changes.length > 0 
                ? changes.map(change => `- ${change}`).join('\n') + '\n\n'
                : '- Version bump\n\n';

            const updatedChangelog = newEntry + changeList + changelog;
            fs.writeFileSync(this.changelogPath, updatedChangelog, 'utf8');
            
            console.log(`✓ Updated CHANGELOG.md`);
            return true;
        } catch (error) {
            console.error('Error updating changelog:', error.message);
            return false;
        }
    }

    async release(version, options = {}) {
        console.log(`🚀 Starting release process for version ${version}`);
        
        const success = [];
        const failures = [];

        // Update package.json
        if (this.updatePackageJson(version)) {
            success.push('package.json');
        } else {
            failures.push('package.json');
        }

        // Update VERSION file
        if (this.updateVersionFile(version)) {
            success.push('VERSION file');
        } else {
            failures.push('VERSION file');
        }

        // Update changelog
        if (this.updateChangelog(version, options.changes)) {
            success.push('CHANGELOG.md');
        } else {
            failures.push('CHANGELOG.md');
        }

        // Create git tag
        if (options.createTag && this.createGitTag(version)) {
            success.push('Git tag');
        } else if (options.createTag) {
            failures.push('Git tag');
        }

        // Generate build hash
        const buildHash = this.generateBuildHash();
        if (buildHash) {
            console.log(`✓ Build hash: ${buildHash}`);
        }

        console.log('\n📊 Release Summary:');
        console.log(`   Version: ${version}`);
        console.log(`   Success: ${success.join(', ')}`);
        if (failures.length > 0) {
            console.log(`   Failures: ${failures.join(', ')}`);
        }

        return {
            version,
            success: success.length,
            failures: failures.length,
            buildHash
        };
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const manager = new VersionManager();

    if (args.length === 0) {
        console.log('Usage: node version-manager.js [command] [options]');
        console.log('\nCommands:');
        console.log('  current                - Show current version');
        console.log('  bump <type> [id]       - Bump version (major|minor|patch|prerelease)');
        console.log('  release <version>      - Create full release');
        console.log('  tag <version>          - Create git tag only');
        console.log('\nExamples:');
        console.log('  node version-manager.js current');
        console.log('  node version-manager.js bump minor');
        console.log('  node version-manager.js bump prerelease beta');
        console.log('  node version-manager.js release 1.2.3');
        process.exit(0);
    }

    const command = args[0];

    try {
        switch (command) {
            case 'current':
                console.log(`Current version: ${manager.getCurrentVersion()}`);
                break;

            case 'bump':
                const type = args[1];
                const prereleaseId = args[2];
                if (!type) {
                    console.error('Error: Version type required');
                    process.exit(1);
                }
                const newVersion = manager.bumpVersion(type, prereleaseId);
                console.log(`New version: ${newVersion}`);
                break;

            case 'release':
                const version = args[1] || manager.bumpVersion('patch');
                manager.release(version, {
                    createTag: true,
                    changes: args.slice(2)
                }).then(result => {
                    if (result.failures > 0) {
                        process.exit(1);
                    }
                });
                break;

            case 'tag':
                const tagVersion = args[1] || manager.getCurrentVersion();
                manager.createGitTag(tagVersion);
                break;

            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

module.exports = VersionManager;