const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const packageConfig = {
  name: 'guest-pass-system',
  version: process.env.npm_package_version || '1.0.0',
  buildDate: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production',
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch
};

function createPackage() {
  console.log('🚀 Creating deployment package...');
  
  const distPath = path.join(__dirname, '../dist');
  const packagePath = path.join(__dirname, '../packages');
  const packageName = `${packageConfig.name}-${packageConfig.version}-${packageConfig.environment}.zip`;
  const packageFullPath = path.join(packagePath, packageName);
  
  // Ensure packages directory exists
  if (!fs.existsSync(packagePath)) {
    fs.mkdirSync(packagePath, { recursive: true });
  }
  
  // Create package metadata
  const metadata = {
    ...packageConfig,
    files: [],
    checksums: {},
    dependencies: {},
    buildInfo: {
      webpackVersion: getDependencyVersion('webpack'),
      babelVersion: getDependencyVersion('@babel/core'),
      typescriptVersion: getDependencyVersion('typescript')
    }
  };
  
  // Generate checksums for all files
  const checksums = generateChecksums(distPath);
  metadata.checksums = checksums;
  
  // Create package manifest
  const manifestPath = path.join(distPath, 'package-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(metadata, null, 2));
  
  // Create ZIP archive
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(packageFullPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    output.on('close', () => {
      const sizeInMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
      console.log(`✅ Package created: ${packageName} (${sizeInMB} MB)`);
      console.log(`📦 Total files: ${archive.pointer()} bytes`);
      
      // Verify package integrity
      verifyPackage(packageFullPath, checksums);
      
      resolve({
        packageName,
        packagePath: packageFullPath,
        size: archive.pointer(),
        checksums
      });
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    
    // Add dist files
    archive.directory(distPath, false);
    
    // Add deployment scripts
    archive.directory(path.join(__dirname, '../scripts'), 'scripts');
    
    // Add configuration files
    archive.file(path.join(__dirname, '../package.json'), { name: 'package.json' });
    archive.file(path.join(__dirname, '../vercel.json'), { name: 'vercel.json' });
    archive.file(path.join(__dirname, '../README.md'), { name: 'README.md' });
    
    // Add environment files (template only)
    archive.file(path.join(__dirname, '../.env.production'), { name: '.env.production.template' });
    
    // Finalize the archive
    archive.finalize();
  });
}

function generateChecksums(directory) {
  const checksums = {};
  
  function processDirectory(dir, basePath = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        processDirectory(fullPath, relativePath);
      } else {
        const content = fs.readFileSync(fullPath);
        const hash = require('crypto').createHash('sha256').update(content).digest('hex');
        checksums[relativePath] = hash;
      }
    });
  }
  
  processDirectory(directory);
  return checksums;
}

function verifyPackage(packagePath, expectedChecksums) {
  console.log('🔍 Verifying package integrity...');
  
  try {
    // Extract and verify checksums
    const extractPath = path.join(__dirname, '../temp-extract');
    execSync(`unzip -q "${packagePath}" -d "${extractPath}"`);
    
    const actualChecksums = generateChecksums(extractPath);
    let isValid = true;
    
    Object.keys(expectedChecksums).forEach(file => {
      if (actualChecksums[file] !== expectedChecksums[file]) {
        console.error(`❌ Checksum mismatch for ${file}`);
        isValid = false;
      }
    });
    
    if (isValid) {
      console.log('✅ Package integrity verified');
    } else {
      console.error('❌ Package integrity check failed');
      process.exit(1);
    }
    
    // Cleanup
    execSync(`rm -rf "${extractPath}"`);
  } catch (error) {
    console.error('❌ Package verification failed:', error.message);
    process.exit(1);
  }
}

function getDependencyVersion(packageName) {
  try {
    const packagePath = require.resolve(`${packageName}/package.json`);
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return 'unknown';
  }
}

// Run package creation
if (require.main === module) {
  createPackage()
    .then(result => {
      console.log('🎉 Package creation completed successfully!');
      console.log('Package details:');
      console.log(`  Name: ${result.packageName}`);
      console.log(`  Path: ${result.packagePath}`);
      console.log(`  Size: ${(result.size / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  Files: ${Object.keys(result.checksums).length}`);
      
      // Save package info for deployment
      const packageInfo = {
        ...packageConfig,
        packageName: result.packageName,
        packagePath: result.packagePath,
        size: result.size,
        fileCount: Object.keys(result.checksums).length,
        checksums: result.checksums,
        createdAt: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(__dirname, '../packages/latest-package.json'),
        JSON.stringify(packageInfo, null, 2)
      );
      
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Package creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createPackage, generateChecksums, verifyPackage };