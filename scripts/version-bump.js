const fs = require('fs');
const path = require('path');

class VersionManager {
  constructor() {
    this.packageJsonPath = path.join(__dirname, '../package.json');
    this.versionFilePath = path.join(__dirname, '../VERSION');
    this.changelogPath = path.join(__dirname, '../CHANGELOG.md');
  }

  bumpVersion(bumpType = 'patch') {
    console.log(`📈 Bumping version: ${bumpType}`);
    
    try {
      // Read current version
      const currentVersion = this.getCurrentVersion();
      console.log(`Current version: ${currentVersion}`);
      
      // Calculate new version
      const newVersion = this.calculateNewVersion(currentVersion, bumpType);
      console.log(`New version: ${newVersion}`);
      
      // Update package.json
      this.updatePackageJson(newVersion);
      
      // Update VERSION file
      this.updateVersionFile(newVersion);
      
      // Update changelog
      this.updateChangelog(newVersion);
      
      // Create git tag
      this.createGitTag(newVersion);
      
      console.log(`✅ Version bumped successfully: ${currentVersion} → ${newVersion}`);
      
      return {
        oldVersion: currentVersion,
        newVersion: newVersion,
        bumpType: bumpType
      };
      
    } catch (error) {
      console.error('❌ Version bump failed:', error.message);
      throw error;
    }
  }

  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      return packageJson.version;
    } catch (error) {
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
  }

  calculateNewVersion(currentVersion, bumpType) {
    const parts = currentVersion.split('.').map(Number);
    const [major, minor, patch] = parts;
    
    switch (bumpType.toLowerCase()) {
      case 'major':
        return `${major + 1}.0.0`;
      case 'minor':
        return `${major}.${minor + 1}.0`;
      case 'patch':
        return `${major}.${minor}.${patch + 1}`;
      default:
        throw new Error(`Invalid bump type: ${bumpType}. Use 'major', 'minor', or 'patch'.`);
    }
  }

  updatePackageJson(newVersion) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      packageJson.version = newVersion;
      
      fs.writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Updated package.json version: ${newVersion}`);
      
    } catch (error) {
      throw new Error(`Failed to update package.json: ${error.message}`);
    }
  }

  updateVersionFile(newVersion) {
    try {
      fs.writeFileSync(this.versionFilePath, newVersion);
      console.log(`✅ Updated VERSION file: ${newVersion}`);
      
    } catch (error) {
      throw new Error(`Failed to update VERSION file: ${error.message}`);
    }
  }

  updateChangelog(newVersion) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const changelogEntry = `## [${newVersion}] - ${today}

### Added
- New features and improvements

### Changed
- Updated dependencies and configurations

### Fixed
- Bug fixes and stability improvements

### Security
- Security updates and patches

---

`;

      let existingChangelog = '';
      if (fs.existsSync(this.changelogPath)) {
        existingChangelog = fs.readFileSync(this.changelogPath, 'utf8');
      }

      const updatedChangelog = changelogEntry + existingChangelog;
      fs.writeFileSync(this.changelogPath, updatedChangelog);
      
      console.log(`✅ Updated CHANGELOG.md: ${newVersion}`);
      
    } catch (error) {
      console.warn(`⚠️  Failed to update changelog: ${error.message}`);
      // Don't fail the version bump if changelog update fails
    }
  }

  createGitTag(newVersion) {
    try {
      const { execSync } = require('child_process');
      
      // Check if git is available
      try {
        execSync('git --version', { stdio: 'pipe' });
      } catch (error) {
        console.log('⚠️  Git not available, skipping tag creation');
        return;
      }

      // Create annotated tag
      const tagMessage = `Release version ${newVersion}`;
      execSync(`git tag -a "v${newVersion}" -m "${tagMessage}"`, { stdio: 'inherit' });
      
      console.log(`✅ Created git tag: v${newVersion}`);
      
      // Push tag to remote (optional)
      try {
        execSync('git push origin "v${newVersion}"', { stdio: 'inherit' });
        console.log(`✅ Pushed tag to remote: v${newVersion}`);
      } catch (error) {
        console.log('⚠️  Failed to push tag to remote (this is optional)');
      }
      
    } catch (error) {
      console.warn(`⚠️  Failed to create git tag: ${error.message}`);
      // Don't fail the version bump if tag creation fails
    }
  }

  getVersionHistory() {
    try {
      const { execSync } = require('child_process');
      
      // Get git tags
      const tags = execSync('git tag --sort=-version:refname', { encoding: 'utf8' })
        .split('\n')
        .filter(tag => tag.startsWith('v'))
        .map(tag => tag.substring(1)); // Remove 'v' prefix
      
      return tags;
      
    } catch (error) {
      console.warn('⚠️  Failed to get version history:', error.message);
      return [];
    }
  }

  validateVersion(version) {
    const versionPattern = /^\d+\.\d+\.\d+$/;
    return versionPattern.test(version);
  }

  compareVersions(version1, version2) {
    const parts1 = version1.split('.').map(Number);
    const parts2 = version2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
    
    return 0;
  }

  getLatestVersion() {
    try {
      const history = this.getVersionHistory();
      return history.length > 0 ? history[0] : null;
    } catch (error) {
      return null;
    }
  }

  generateReleaseNotes(newVersion) {
    const template = `# Release Notes - Version ${newVersion}

## What's New

### Features
- [List new features here]

### Improvements
- [List improvements here]

### Bug Fixes
- [List bug fixes here]

### Security Updates
- [List security updates here]

## Upgrade Instructions

1. Backup your current installation
2. Download the new version
3. Follow the deployment guide
4. Verify the installation

## Known Issues

- [List any known issues here]

## Support

For support, please contact: dev-team@your-org.com

---

Generated on: ${new Date().toISOString()}
`;

    return template;
  }
}

// Run version bump if called directly
if (require.main === module) {
  const bumpType = process.argv[2] || 'patch';
  const versionManager = new VersionManager();
  
  try {
    const result = versionManager.bumpVersion(bumpType);
    
    console.log('\n🎉 Version bump completed!');
    console.log(`Old version: ${result.oldVersion}`);
    console.log(`New version: ${result.newVersion}`);
    console.log(`Bump type: ${result.bumpType}`);
    
    // Generate release notes
    const releaseNotes = versionManager.generateReleaseNotes(result.newVersion);
    console.log('\n📄 Release Notes:');
    console.log(releaseNotes);
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Version bump failed:', error.message);
    process.exit(1);
  }
}

module.exports = { VersionManager };