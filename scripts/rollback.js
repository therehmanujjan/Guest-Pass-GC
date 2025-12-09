const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RollbackManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.deploymentLogsPath = path.join(__dirname, '../deployment-logs');
    this.packagesPath = path.join(__dirname, '../packages');
  }

  async listAvailableVersions() {
    console.log('📋 Listing available versions for rollback...');
    
    try {
      const deploymentHistory = this.getDeploymentHistory();
      const packages = this.getAvailablePackages();
      
      console.log('\n🚀 Deployment History:');
      deploymentHistory.forEach((deployment, index) => {
        const status = deployment.status === 'success' ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${deployment.id} (${deployment.environment}) - ${new Date(deployment.startTime).toLocaleString()}`);
      });
      
      console.log('\n📦 Available Packages:');
      packages.forEach((pkg, index) => {
        console.log(`${index + 1}. ${pkg.name} (${pkg.environment}) - ${new Date(pkg.createdAt).toLocaleString()}`);
      });
      
      return {
        deployments: deploymentHistory,
        packages: packages
      };
      
    } catch (error) {
      console.error('❌ Failed to list versions:', error.message);
      throw error;
    }
  }

  async rollbackToVersion(targetVersion) {
    console.log(`🔄 Initiating rollback to version: ${targetVersion}`);
    
    try {
      // Step 1: Validate target version
      await this.validateTargetVersion(targetVersion);
      
      // Step 2: Create backup of current version
      await this.createBackup();
      
      // Step 3: Download target version package
      const packagePath = await this.downloadTargetPackage(targetVersion);
      
      // Step 4: Verify package integrity
      await this.verifyPackageIntegrity(packagePath);
      
      // Step 5: Deploy target version
      await this.deployPackage(packagePath);
      
      // Step 6: Verify deployment
      await this.verifyDeployment();
      
      // Step 7: Update deployment records
      await this.updateRollbackRecords(targetVersion);
      
      console.log(`✅ Rollback to version ${targetVersion} completed successfully`);
      
    } catch (error) {
      console.error(`❌ Rollback to version ${targetVersion} failed:`, error.message);
      
      // Attempt to restore from backup
      try {
        console.log('🔄 Attempting to restore from backup...');
        await this.restoreFromBackup();
        console.log('✅ Backup restoration completed');
      } catch (backupError) {
        console.error('❌ Backup restoration failed:', backupError.message);
        throw error;
      }
      
      throw error;
    }
  }

  async rollbackToPrevious() {
    console.log('🔄 Rolling back to previous version...');
    
    try {
      const deploymentHistory = this.getDeploymentHistory();
      const successfulDeployments = deploymentHistory.filter(d => d.status === 'success');
      
      if (successfulDeployments.length < 2) {
        throw new Error('No previous successful deployment available for rollback');
      }
      
      const previousDeployment = successfulDeployments[1]; // Second most recent
      const previousVersion = this.extractVersionFromDeployment(previousDeployment);
      
      console.log(`📍 Previous version identified: ${previousVersion}`);
      
      await this.rollbackToVersion(previousVersion);
      
    } catch (error) {
      console.error('❌ Rollback to previous version failed:', error.message);
      throw error;
    }
  }

  validateTargetVersion(targetVersion) {
    console.log(`🔍 Validating target version: ${targetVersion}`);
    
    // Validate version format
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(targetVersion)) {
      throw new Error(`Invalid version format: ${targetVersion}. Expected format: X.Y.Z`);
    }
    
    // Check if version exists in packages
    const packages = this.getAvailablePackages();
    const targetPackage = packages.find(pkg => pkg.version === targetVersion);
    
    if (!targetPackage) {
      throw new Error(`Version ${targetVersion} not found in available packages`);
    }
    
    console.log(`✅ Target version validated: ${targetVersion}`);
    return targetPackage;
  }

  async createBackup() {
    console.log('💾 Creating backup of current version...');
    
    try {
      const currentVersion = this.getCurrentVersion();
      const backupName = `backup-${currentVersion}-${Date.now()}`;
      const backupPath = path.join(this.packagesPath, 'backups', backupName);
      
      // Create backup directory
      if (!fs.existsSync(path.dirname(backupPath))) {
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      }
      
      // Copy current dist to backup
      const distPath = path.join(__dirname, '../dist');
      if (fs.existsSync(distPath)) {
        this.copyDirectory(distPath, backupPath);
        
        // Create backup manifest
        const manifest = {
          version: currentVersion,
          backupName: backupName,
          backupPath: backupPath,
          createdAt: new Date().toISOString(),
          environment: this.environment
        };
        
        fs.writeFileSync(
          path.join(backupPath, 'backup-manifest.json'),
          JSON.stringify(manifest, null, 2)
        );
        
        console.log(`✅ Backup created: ${backupName}`);
        return backupPath;
        
      } else {
        console.log('⚠️  No dist directory found, skipping backup');
        return null;
      }
      
    } catch (error) {
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  getCurrentVersion() {
    try {
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      throw new Error(`Failed to get current version: ${error.message}`);
    }
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  async downloadTargetPackage(targetVersion) {
    console.log(`📥 Downloading package for version: ${targetVersion}`);
    
    try {
      const packages = this.getAvailablePackages();
      const targetPackage = packages.find(pkg => pkg.version === targetVersion);
      
      if (!targetPackage) {
        throw new Error(`Package for version ${targetVersion} not found`);
      }
      
      console.log(`✅ Target package located: ${targetPackage.path}`);
      return targetPackage.path;
      
    } catch (error) {
      throw new Error(`Failed to locate target package: ${error.message}`);
    }
  }

  async verifyPackageIntegrity(packagePath) {
    console.log(`🔍 Verifying package integrity: ${packagePath}`);
    
    try {
      if (!fs.existsSync(packagePath)) {
        throw new Error(`Package not found: ${packagePath}`);
      }
      
      // Check if it's a ZIP file
      if (packagePath.endsWith('.zip')) {
        // Verify ZIP integrity
        execSync(`unzip -t "${packagePath}"`, { stdio: 'pipe' });
        console.log('✅ ZIP package integrity verified');
      } else {
        // Verify directory package
        const manifestPath = path.join(packagePath, 'package-manifest.json');
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          console.log(`✅ Package manifest found: ${manifest.version}`);
        } else {
          console.log('⚠️  No package manifest found, continuing with caution');
        }
      }
      
    } catch (error) {
      throw new Error(`Package integrity verification failed: ${error.message}`);
    }
  }

  async deployPackage(packagePath) {
    console.log(`🚀 Deploying package: ${packagePath}`);
    
    try {
      const distPath = path.join(__dirname, '../dist');
      
      // Clean current dist
      if (fs.existsSync(distPath)) {
        execSync(`rm -rf "${distPath}"`, { stdio: 'pipe' });
      }
      
      // Extract or copy package to dist
      if (packagePath.endsWith('.zip')) {
        // Extract ZIP
        execSync(`unzip -q "${packagePath}" -d "${distPath}"`, { stdio: 'pipe' });
        console.log('✅ ZIP package extracted');
      } else {
        // Copy directory
        this.copyDirectory(packagePath, distPath);
        console.log('✅ Package directory copied');
      }
      
      // Verify deployment
      if (!fs.existsSync(distPath)) {
        throw new Error('Deployment failed: dist directory not created');
      }
      
      console.log('✅ Package deployed successfully');
      
    } catch (error) {
      throw new Error(`Package deployment failed: ${error.message}`);
    }
  }

  async verifyDeployment() {
    console.log('🏥 Verifying deployment...');
    
    try {
      const distPath = path.join(__dirname, '../dist');
      
      // Check if dist exists
      if (!fs.existsSync(distPath)) {
        throw new Error('Deployment verification failed: dist directory not found');
      }
      
      // Check for essential files
      const essentialFiles = [
        'index.html',
        'assets',
        'package-manifest.json'
      ];
      
      const missingFiles = essentialFiles.filter(file => 
        !fs.existsSync(path.join(distPath, file))
      );
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing essential files: ${missingFiles.join(', ')}`);
      }
      
      // Verify package manifest
      const manifestPath = path.join(distPath, 'package-manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        console.log(`✅ Deployment verified: ${manifest.version}`);
      } else {
        console.log('⚠️  No package manifest found, but deployment appears valid');
      }
      
    } catch (error) {
      throw new Error(`Deployment verification failed: ${error.message}`);
    }
  }

  async updateRollbackRecords(targetVersion) {
    console.log(`📝 Updating rollback records for version: ${targetVersion}`);
    
    try {
      const rollbackRecord = {
        id: `rollback-${Date.now()}`,
        targetVersion: targetVersion,
        previousVersion: this.getCurrentVersion(),
        environment: this.environment,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
      
      const rollbackLogPath = path.join(__dirname, '../rollback-history.json');
      let rollbackHistory = [];
      
      if (fs.existsSync(rollbackLogPath)) {
        rollbackHistory = JSON.parse(fs.readFileSync(rollbackLogPath, 'utf8'));
      }
      
      rollbackHistory.unshift(rollbackRecord);
      
      // Keep only last 50 rollback records
      if (rollbackHistory.length > 50) {
        rollbackHistory = rollbackHistory.slice(0, 50);
      }
      
      fs.writeFileSync(rollbackLogPath, JSON.stringify(rollbackHistory, null, 2));
      
      console.log('✅ Rollback records updated');
      
    } catch (error) {
      console.warn('⚠️  Failed to update rollback records:', error.message);
      // Don't fail the rollback if record update fails
    }
  }

  async restoreFromBackup() {
    console.log('🔄 Restoring from backup...');
    
    try {
      const backupsPath = path.join(this.packagesPath, 'backups');
      
      if (!fs.existsSync(backupsPath)) {
        throw new Error('No backups directory found');
      }
      
      const backups = fs.readdirSync(backupsPath)
        .filter(item => item.startsWith('backup-'))
        .map(item => ({
          name: item,
          path: path.join(backupsPath, item),
          createdAt: fs.statSync(path.join(backupsPath, item)).ctime
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
      
      if (backups.length === 0) {
        throw new Error('No backups found');
      }
      
      const latestBackup = backups[0];
      console.log(`📍 Latest backup found: ${latestBackup.name}`);
      
      // Restore from backup
      const distPath = path.join(__dirname, '../dist');
      
      if (fs.existsSync(distPath)) {
        execSync(`rm -rf "${distPath}"`, { stdio: 'pipe' });
      }
      
      this.copyDirectory(latestBackup.path, distPath);
      
      console.log('✅ Restored from backup successfully');
      
    } catch (error) {
      throw new Error(`Backup restoration failed: ${error.message}`);
    }
  }

  getDeploymentHistory() {
    try {
      if (!fs.existsSync(this.deploymentLogsPath)) {
        return [];
      }
      
      const logFiles = fs.readdirSync(this.deploymentLogsPath)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const logPath = path.join(this.deploymentLogsPath, file);
          return JSON.parse(fs.readFileSync(logPath, 'utf8'));
        })
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      
      return logFiles;
      
    } catch (error) {
      console.warn('⚠️  Failed to get deployment history:', error.message);
      return [];
    }
  }

  getAvailablePackages() {
    try {
      if (!fs.existsSync(this.packagesPath)) {
        return [];
      }
      
      const items = fs.readdirSync(this.packagesPath)
        .filter(item => item.endsWith('.zip') || item === 'latest-package.json')
        .map(item => {
          const itemPath = path.join(this.packagesPath, item);
          const stat = fs.statSync(itemPath);
          
          if (item === 'latest-package.json') {
            const latestPackage = JSON.parse(fs.readFileSync(itemPath, 'utf8'));
            return {
              name: latestPackage.packageName,
              path: latestPackage.packagePath,
              version: latestPackage.version,
              environment: latestPackage.environment,
              size: latestPackage.size,
              createdAt: latestPackage.createdAt,
              isLatest: true
            };
          } else {
            // Parse package name to extract version and environment
            const match = item.match(/guest-pass-system-(\d+\.\d+\.\d+)-(\w+)\.zip/);
            return {
              name: item,
              path: itemPath,
              version: match ? match[1] : 'unknown',
              environment: match ? match[2] : 'unknown',
              size: stat.size,
              createdAt: stat.ctime,
              isLatest: false
            };
          }
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return items;
      
    } catch (error) {
      console.warn('⚠️  Failed to get available packages:', error.message);
      return [];
    }
  }

  extractVersionFromDeployment(deployment) {
    // Try to extract version from deployment ID or manifest
    if (deployment.id) {
      const match = deployment.id.match(/(\d+\.\d+\.\d+)/);
      if (match) {
        return match[1];
      }
    }
    
    // Fallback to current version
    return this.getCurrentVersion();
  }
}

// Run rollback if called directly
if (require.main === module) {
  const rollbackManager = new RollbackManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'list':
      rollbackManager.listAvailableVersions()
        .then(() => process.exit(0))
        .catch(error => {
          console.error('❌ Failed to list versions:', error.message);
          process.exit(1);
        });
      break;
      
    case 'previous':
      rollbackManager.rollbackToPrevious()
        .then(() => {
          console.log('✅ Rollback to previous version completed');
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Rollback failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'to':
      const targetVersion = process.argv[3];
      if (!targetVersion) {
        console.error('❌ Please specify target version: npm run rollback to <version>');
        process.exit(1);
      }
      
      rollbackManager.rollbackToVersion(targetVersion)
        .then(() => {
          console.log(`✅ Rollback to version ${targetVersion} completed`);
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Rollback failed:', error.message);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`
🔄 Guest Pass System Rollback Manager

Usage:
  npm run rollback list          - List available versions
  npm run rollback previous      - Rollback to previous version
  npm run rollback to <version>  - Rollback to specific version

Examples:
  npm run rollback to 1.0.0
  npm run rollback to 1.2.3
`);
      process.exit(0);
  }
}

module.exports = { RollbackManager };