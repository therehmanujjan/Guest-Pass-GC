const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const securityConfig = {
  scanPaths: [
    'dist/**/*.js',
    'dist/**/*.html',
    'dist/**/*.css'
  ],
  forbiddenPatterns: [
    {
      pattern: /console\.log\s*\([^)]*password[^)]*\)/gi,
      severity: 'critical',
      description: 'Potential password logging'
    },
    {
      pattern: /password\s*=\s*['"][^'"]+['"]/gi,
      severity: 'critical',
      description: 'Hardcoded password'
    },
    {
      pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
      severity: 'critical',
      description: 'Hardcoded API key'
    },
    {
      pattern: /secret\s*=\s*['"][^'"]+['"]/gi,
      severity: 'high',
      description: 'Hardcoded secret'
    },
    {
      pattern: /eval\s*\(/gi,
      severity: 'high',
      description: 'Use of eval() function'
    },
    {
      pattern: /innerHTML\s*=\s*[^;]+/gi,
      severity: 'medium',
      description: 'Potential XSS vulnerability'
    },
    {
      pattern: /document\.write\s*\(/gi,
      severity: 'medium',
      description: 'Use of document.write()'
    }
  ],
  requiredHeaders: [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Content-Security-Policy'
  ]
};

function runSecurityAudit() {
  console.log('🔒 Running security audit...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vulnerabilities: [],
    warnings: [],
    info: [],
    summary: {}
  };
  
  // Run npm audit
  try {
    console.log('📊 Running npm audit...');
    const npmAudit = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
    const auditData = JSON.parse(npmAudit);
    
    if (auditData.metadata && auditData.metadata.vulnerabilities) {
      const vulns = auditData.metadata.vulnerabilities;
      results.summary.npmVulnerabilities = vulns;
      
      if (vulns.total > 0) {
        results.vulnerabilities.push({
          type: 'npm-dependency',
          severity: vulns.high > 0 ? 'high' : 'medium',
          description: `${vulns.total} npm vulnerabilities found`,
          details: vulns
        });
      }
    }
  } catch (error) {
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        if (auditData.metadata && auditData.metadata.vulnerabilities) {
          const vulns = auditData.metadata.vulnerabilities;
          results.summary.npmVulnerabilities = vulns;
          
          if (vulns.total > 0) {
            results.vulnerabilities.push({
              type: 'npm-dependency',
              severity: vulns.high > 0 ? 'high' : 'medium',
              description: `${vulns.total} npm vulnerabilities found`,
              details: vulns
            });
          }
        }
      } catch (parseError) {
        results.warnings.push({
          type: 'npm-audit-failed',
          description: 'npm audit failed to run',
          error: error.message
        });
      }
    }
  }
  
  // Scan built files for security issues
  console.log('🔍 Scanning built files...');
  const distPath = path.join(__dirname, '../dist');
  
  if (fs.existsSync(distPath)) {
    scanDirectory(distPath, results);
  } else {
    results.warnings.push({
      type: 'missing-dist',
      description: 'dist directory not found, skipping file scan'
    });
  }
  
  // Check environment configuration
  checkEnvironmentConfig(results);
  
  // Check for sensitive files
  checkSensitiveFiles(results);
  
  // Generate report
  generateSecurityReport(results);
  
  // Fail build if critical vulnerabilities found
  const criticalVulns = results.vulnerabilities.filter(v => v.severity === 'critical');
  if (criticalVulns.length > 0) {
    console.error('❌ Security audit failed: Critical vulnerabilities found');
    console.error(`Found ${criticalVulns.length} critical vulnerabilities`);
    process.exit(1);
  }
  
  console.log('✅ Security audit completed');
  return results;
}

function scanDirectory(directory, results, basePath = '') {
  const items = fs.readdirSync(directory);
  
  items.forEach(item => {
    const fullPath = path.join(directory, item);
    const relativePath = path.join(basePath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath, results, relativePath);
    } else if (item.endsWith('.js') || item.endsWith('.html') || item.endsWith('.css')) {
      scanFile(fullPath, relativePath, results);
    }
  });
}

function scanFile(filePath, relativePath, results) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    securityConfig.forbiddenPatterns.forEach(patternConfig => {
      const matches = content.match(patternConfig.pattern);
      
      if (matches) {
        results.vulnerabilities.push({
          type: 'code-pattern',
          severity: patternConfig.severity,
          description: patternConfig.description,
          file: relativePath,
          matches: matches.length,
          sample: matches[0].substring(0, 100) + (matches[0].length > 100 ? '...' : '')
        });
      }
    });
    
    // Check for missing security headers
    if (relativePath.endsWith('.html')) {
      checkSecurityHeaders(content, relativePath, results);
    }
    
  } catch (error) {
    results.warnings.push({
      type: 'file-scan-error',
      file: relativePath,
      description: 'Failed to scan file',
      error: error.message
    });
  }
}

function checkSecurityHeaders(content, filePath, results) {
  const missingHeaders = [];
  
  securityConfig.requiredHeaders.forEach(header => {
    if (!content.includes(header)) {
      missingHeaders.push(header);
    }
  });
  
  if (missingHeaders.length > 0) {
    results.warnings.push({
      type: 'missing-security-headers',
      file: filePath,
      description: `Missing security headers: ${missingHeaders.join(', ')}`,
      missingHeaders
    });
  }
}

function checkEnvironmentConfig(results) {
  const envFiles = ['.env.development', '.env.staging', '.env.production'];
  
  envFiles.forEach(envFile => {
    const envPath = path.join(__dirname, '..', envFile);
    
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      
      // Check for hardcoded secrets
      if (content.includes('password=') && !content.includes('${')) {
        results.vulnerabilities.push({
          type: 'hardcoded-secret',
          severity: 'critical',
          file: envFile,
          description: 'Potential hardcoded password in environment file'
        });
      }
      
      // Check for debug mode in production
      if (envFile === '.env.production' && content.includes('APP_DEBUG=true')) {
        results.warnings.push({
          type: 'debug-enabled',
          file: envFile,
          description: 'Debug mode enabled in production environment'
        });
      }
    }
  });
}

function checkSensitiveFiles(results) {
  const sensitiveFiles = [
    '.git',
    '.env',
    'node_modules',
    'package-lock.json',
    'yarn.lock',
    '.DS_Store',
    'Thumbs.db'
  ];
  
  sensitiveFiles.forEach(file => {
    const filePath = path.join(__dirname, '../dist', file);
    
    if (fs.existsSync(filePath)) {
      results.warnings.push({
        type: 'sensitive-file-exposed',
        file: file,
        description: `Sensitive file may be exposed in build: ${file}`
      });
    }
  });
}

function generateSecurityReport(results) {
  const reportPath = path.join(__dirname, '../security-audit-report.json');
  
  const report = {
    ...results,
    summary: {
      totalVulnerabilities: results.vulnerabilities.length,
      critical: results.vulnerabilities.filter(v => v.severity === 'critical').length,
      high: results.vulnerabilities.filter(v => v.severity === 'high').length,
      medium: results.vulnerabilities.filter(v => v.severity === 'medium').length,
      low: results.vulnerabilities.filter(v => v.severity === 'low').length,
      warnings: results.warnings.length,
      info: results.info.length
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📋 Security Audit Summary:');
  console.log(`  Vulnerabilities: ${report.summary.totalVulnerabilities}`);
  console.log(`    Critical: ${report.summary.critical}`);
  console.log(`    High: ${report.summary.high}`);
  console.log(`    Medium: ${report.summary.medium}`);
  console.log(`    Low: ${report.summary.low}`);
  console.log(`  Warnings: ${report.summary.warnings}`);
  console.log(`  Info: ${report.summary.info}`);
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  if (report.summary.critical > 0) {
    console.log('\n⚠️  Critical vulnerabilities found - Build will fail');
  }
}

// Run audit if called directly
if (require.main === module) {
  runSecurityAudit();
}

module.exports = { runSecurityAudit };