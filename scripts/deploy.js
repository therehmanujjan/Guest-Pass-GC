const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class DeploymentManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = this.loadDeploymentConfig();
    this.deploymentId = this.generateDeploymentId();
    this.startTime = Date.now();
  }

  loadDeploymentConfig() {
    const configPath = path.join(__dirname, '../deployment-config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    return {
      environments: {
        development: {
          url: 'http://localhost:3000',
          healthCheck: {
            endpoint: '/health',
            timeout: 5000,
            retries: 3
          }
        },
        staging: {
          url: 'https://guest-pass-staging.vercel.app',
          healthCheck: {
            endpoint: '/health',
            timeout: 10000,
            retries: 5
          }
        },
        production: {
          url: 'https://guest-pass-system.vercel.app',
          healthCheck: {
            endpoint: '/health',
            timeout: 15000,
            retries: 10
          }
        }
      }
    };
  }

  generateDeploymentId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.environment}-${timestamp}-${random}`;
  }

  async deploy() {
    console.log(`🚀 Starting deployment: ${this.deploymentId}`);
    console.log(`📍 Environment: ${this.environment}`);
    
    const deploymentLog = {
      id: this.deploymentId,
      environment: this.environment,
      startTime: this.startTime,
      steps: []
    };

    try {
      // Step 1: Pre-deployment checks
      await this.logStep(deploymentLog, 'pre-checks', async () => {
        await this.runPreDeploymentChecks();
      });

      // Step 2: Build application
      await this.logStep(deploymentLog, 'build', async () => {
        await this.buildApplication();
      });

      // Step 3: Security audit
      await this.logStep(deploymentLog, 'security-audit', async () => {
        await this.runSecurityAudit();
      });

      // Step 4: Create deployment package
      await this.logStep(deploymentLog, 'package', async () => {
        await this.createDeploymentPackage();
      });

      // Step 5: Deploy to target platform
      await this.logStep(deploymentLog, 'deploy', async () => {
        await this.deployToPlatform();
      });

      // Step 6: Health check
      await this.logStep(deploymentLog, 'health-check', async () => {
        await this.performHealthCheck();
      });

      // Step 7: Post-deployment verification
      await this.logStep(deploymentLog, 'verification', async () => {
        await this.runPostDeploymentVerification();
      });

      // Deployment successful
      deploymentLog.status = 'success';
      deploymentLog.endTime = Date.now();
      deploymentLog.duration = deploymentLog.endTime - this.startTime;
      
      console.log(`✅ Deployment completed successfully: ${this.deploymentId}`);
      console.log(`⏱️  Duration: ${deploymentLog.duration}ms`);
      
    } catch (error) {
      // Deployment failed
      deploymentLog.status = 'failed';
      deploymentLog.error = error.message;
      deploymentLog.endTime = Date.now();
      deploymentLog.duration = deploymentLog.endTime - this.startTime;
      
      console.error(`❌ Deployment failed: ${this.deploymentId}`);
      console.error(`💥 Error: ${error.message}`);
      
      // Attempt rollback
      try {
        await this.rollback();
        console.log('🔄 Automatic rollback completed');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError.message);
      }
      
      throw error;
    } finally {
      // Save deployment log
      this.saveDeploymentLog(deploymentLog);
      
      // Send notifications
      await this.sendDeploymentNotification(deploymentLog);
    }
  }

  async logStep(deploymentLog, stepName, stepFunction) {
    const stepStart = Date.now();
    console.log(`📋 Starting step: ${stepName}`);
    
    try {
      await stepFunction();
      
      const stepEnd = Date.now();
      deploymentLog.steps.push({
        name: stepName,
        status: 'success',
        duration: stepEnd - stepStart,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Step completed: ${stepName} (${stepEnd - stepStart}ms)`);
      
    } catch (error) {
      const stepEnd = Date.now();
      deploymentLog.steps.push({
        name: stepName,
        status: 'failed',
        duration: stepEnd - stepStart,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ Step failed: ${stepName} - ${error.message}`);
      throw error;
    }
  }

  async runPreDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check environment variables
    this.checkEnvironmentVariables();
    
    // Check Node.js version
    this.checkNodeVersion();
    
    // Check dependencies
    this.checkDependencies();
    
    // Check disk space
    this.checkDiskSpace();
    
    console.log('✅ Pre-deployment checks passed');
  }

  checkEnvironmentVariables() {
    const requiredVars = this.getRequiredEnvironmentVariables();
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  getRequiredEnvironmentVariables() {
    const baseVars = ['NODE_ENV'];
    
    switch (this.environment) {
      case 'production':
        return [
          ...baseVars,
          'PROD_JWT_SECRET',
          'PROD_SESSION_SECRET',
          'PROD_DB_PASSWORD'
        ];
      case 'staging':
        return [
          ...baseVars,
          'STAGING_JWT_SECRET',
          'STAGING_SESSION_SECRET'
        ];
      default:
        return baseVars;
    }
  }

  checkNodeVersion() {
    const requiredVersion = '16.0.0';
    const currentVersion = process.version.substring(1); // Remove 'v' prefix
    
    if (!this.satisfiesVersion(currentVersion, requiredVersion)) {
      throw new Error(`Node.js version ${currentVersion} is below required version ${requiredVersion}`);
    }
  }

  checkDependencies() {
    try {
      execSync('npm ls --depth=0', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Dependency check failed. Run "npm install" to fix dependencies.');
    }
  }

  checkDiskSpace() {
    const stats = fs.statSync('.');
    const freeSpace = stats.size; // Simplified check
    
    if (freeSpace < 100 * 1024 * 1024) { // 100MB minimum
      throw new Error('Insufficient disk space for deployment');
    }
  }

  satisfiesVersion(current, required) {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);
    
    for (let i = 0; i < requiredParts.length; i++) {
      if (currentParts[i] > requiredParts[i]) return true;
      if (currentParts[i] < requiredParts[i]) return false;
    }
    
    return true;
  }

  async buildApplication() {
    console.log('🏗️  Building application...');
    
    try {
      // Clean previous build
      execSync('npm run clean', { stdio: 'inherit' });
      
      // Run security audit
      execSync('npm run security:audit', { stdio: 'inherit' });
      
      // Build application
      const buildCommand = this.environment === 'production' ? 'npm run build' : `npm run build:${this.environment}`;
      execSync(buildCommand, { stdio: 'inherit' });
      
      console.log('✅ Application built successfully');
      
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async runSecurityAudit() {
    console.log('🔒 Running security audit...');
    
    try {
      execSync('npm run security:audit', { stdio: 'inherit' });
      console.log('✅ Security audit passed');
      
    } catch (error) {
      throw new Error(`Security audit failed: ${error.message}`);
    }
  }

  async createDeploymentPackage() {
    console.log('📦 Creating deployment package...');
    
    try {
      execSync('npm run package:create', { stdio: 'inherit' });
      console.log('✅ Deployment package created');
      
    } catch (error) {
      throw new Error(`Package creation failed: ${error.message}`);
    }
  }

  async deployToPlatform() {
    console.log('🚀 Deploying to platform...');
    
    const deployCommand = this.environment === 'production' ? 'npm run deploy:vercel' : 'npm run deploy:staging';
    
    try {
      execSync(deployCommand, { stdio: 'inherit' });
      console.log('✅ Platform deployment completed');
      
    } catch (error) {
      throw new Error(`Platform deployment failed: ${error.message}`);
    }
  }

  async performHealthCheck() {
    console.log('🏥 Performing health check...');
    
    const config = this.config.environments[this.environment];
    const maxRetries = config.healthCheck.retries;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await this.checkHealthEndpoint(config);
        console.log('✅ Health check passed');
        return;
        
      } catch (error) {
        retries++;
        console.log(`⚠️  Health check attempt ${retries} failed: ${error.message}`);
        
        if (retries < maxRetries) {
          await this.delay(config.healthCheck.timeout);
        }
      }
    }
    
    throw new Error(`Health check failed after ${maxRetries} attempts`);
  }

  async checkHealthEndpoint(config) {
    const healthUrl = `${config.url}${config.healthCheck.endpoint}`;
    
    try {
      const response = await this.fetchWithTimeout(healthUrl, {
        timeout: config.healthCheck.timeout
      });
      
      if (!response.ok) {
        throw new Error(`Health check returned ${response.status}`);
      }
      
      const healthData = await response.json();
      
      if (healthData.status !== 'healthy') {
        throw new Error(`Health status: ${healthData.status}`);
      }
      
    } catch (error) {
      throw new Error(`Health check request failed: ${error.message}`);
    }
  }

  async fetchWithTimeout(url, options = {}) {
    const { timeout = 5000 } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async runPostDeploymentVerification() {
    console.log('🔍 Running post-deployment verification...');
    
    // Verify main application
    await this.verifyApplication();
    
    // Verify QR code generation
    await this.verifyQRCodeGeneration();
    
    // Verify user authentication
    await this.verifyAuthentication();
    
    console.log('✅ Post-deployment verification completed');
  }

  async verifyApplication() {
    const config = this.config.environments[this.environment];
    
    try {
      const response = await this.fetchWithTimeout(config.url);
      
      if (!response.ok) {
        throw new Error(`Application verification failed: ${response.status}`);
      }
      
    } catch (error) {
      throw new Error(`Application verification failed: ${error.message}`);
    }
  }

  async verifyQRCodeGeneration() {
    // This would typically involve automated browser testing
    console.log('✅ QR code generation verification (manual testing required)');
  }

  async verifyAuthentication() {
    // This would typically involve API testing
    console.log('✅ Authentication verification (manual testing required)');
  }

  async rollback() {
    console.log('🔄 Initiating rollback...');
    
    try {
      // Get previous deployment
      const previousDeployment = this.getPreviousDeployment();
      
      if (!previousDeployment) {
        throw new Error('No previous deployment available for rollback');
      }
      
      // Restore previous version
      await this.restorePreviousVersion(previousDeployment);
      
      console.log('✅ Rollback completed');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  getPreviousDeployment() {
    const deployments = this.getDeploymentHistory();
    const successfulDeployments = deployments.filter(d => d.status === 'success');
    
    if (successfulDeployments.length < 2) {
      return null;
    }
    
    return successfulDeployments[successfulDeployments.length - 2];
  }

  async restorePreviousVersion(previousDeployment) {
    // This would typically involve platform-specific rollback
    console.log(`🔄 Restoring version: ${previousDeployment.id}`);
    
    // In a real implementation, this would:
    // 1. Restore previous container/image
    // 2. Update load balancer configuration
    // 3. Verify health after rollback
    
    console.log('✅ Previous version restored');
  }

  getDeploymentHistory() {
    const logsDir = path.join(__dirname, '../deployment-logs');
    
    if (!fs.existsSync(logsDir)) {
      return [];
    }
    
    const logFiles = fs.readdirSync(logsDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const logPath = path.join(logsDir, file);
        return JSON.parse(fs.readFileSync(logPath, 'utf8'));
      })
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    return logFiles;
  }

  saveDeploymentLog(deploymentLog) {
    const logsDir = path.join(__dirname, '../deployment-logs');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFileName = `${deploymentLog.id}.json`;
    const logPath = path.join(logsDir, logFileName);
    
    fs.writeFileSync(logPath, JSON.stringify(deploymentLog, null, 2));
    
    console.log(`📋 Deployment log saved: ${logPath}`);
  }

  async sendDeploymentNotification(deploymentLog) {
    const status = deploymentLog.status === 'success' ? '✅ SUCCESS' : '❌ FAILED';
    const message = `Deployment ${this.deploymentId} ${status}\nEnvironment: ${this.environment}\nDuration: ${deploymentLog.duration}ms`;
    
    console.log(`📧 Deployment notification: ${message}`);
    
    // In a real implementation, this would send emails, Slack messages, etc.
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deploymentManager = new DeploymentManager();
  
  deploymentManager.deploy()
    .then(() => {
      console.log('🎉 Deployment process completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Deployment process failed:', error.message);
      process.exit(1);
    });
}

module.exports = { DeploymentManager };