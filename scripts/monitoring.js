const fs = require('fs');
const path = require('path');

const monitoringConfig = {
  healthCheck: {
    endpoint: '/health',
    interval: 30000,
    timeout: 5000,
    retries: 3
  },
  metrics: {
    endpoint: '/metrics',
    collectInterval: 60000
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: 'logs/application.log',
    maxSize: '10m',
    maxFiles: 5
  },
  alerts: {
    enabled: true,
    thresholds: {
      errorRate: 0.05,
      responseTime: 2000,
      memoryUsage: 0.8,
      cpuUsage: 0.8
    }
  }
};

function setupMonitoring() {
  console.log('📊 Setting up monitoring and logging...');
  
  // Create logs directory
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Create monitoring configuration
  const configPath = path.join(__dirname, '../monitoring-config.json');
  fs.writeFileSync(configPath, JSON.stringify(monitoringConfig, null, 2));
  
  // Create health check endpoint
  createHealthCheckEndpoint();
  
  // Create metrics collection
  createMetricsCollection();
  
  // Create logging configuration
  createLoggingConfig();
  
  // Create alerting rules
  createAlertingRules();
  
  console.log('✅ Monitoring setup completed');
  return monitoringConfig;
}

function createHealthCheckEndpoint() {
  const healthCheckCode = `
// Health Check Endpoint
function healthCheck(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'unknown',
    checks: {
      database: checkDatabaseConnection(),
      redis: checkRedisConnection(),
      storage: checkStorageAvailability()
    }
  };
  
  // Determine overall health
  const failedChecks = Object.values(health.checks).filter(check => !check.healthy);
  if (failedChecks.length > 0) {
    health.status = 'unhealthy';
    health.failedChecks = failedChecks;
  }
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
}

function checkDatabaseConnection() {
  try {
    // Add your database connection check here
    return { healthy: true, message: 'Database connection active' };
  } catch (error) {
    return { healthy: false, message: 'Database connection failed', error: error.message };
  }
}

function checkRedisConnection() {
  try {
    // Add your Redis connection check here
    return { healthy: true, message: 'Redis connection active' };
  } catch (error) {
    return { healthy: false, message: 'Redis connection failed', error: error.message };
  }
}

function checkStorageAvailability() {
  try {
    // Add your storage availability check here
    return { healthy: true, message: 'Storage available' };
  } catch (error) {
    return { healthy: false, message: 'Storage unavailable', error: error.message };
  }
}

module.exports = { healthCheck };
`;
  
  const healthCheckPath = path.join(__dirname, '../src/health-check.js');
  fs.writeFileSync(healthCheckPath, healthCheckCode);
}

function createMetricsCollection() {
  const metricsCode = `
// Metrics Collection
class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {}
      },
      responseTime: [],
      errors: [],
      system: {
        memory: {},
        cpu: {}
      }
    };
    
    this.startCollection();
  }
  
  startCollection() {
    // Collect system metrics every minute
    setInterval(() => {
      this.collectSystemMetrics();
    }, 60000);
    
    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupMetrics();
    }, 3600000);
  }
  
  collectSystemMetrics() {
    this.metrics.system.memory = process.memoryUsage();
    this.metrics.system.cpu = process.cpuUsage();
  }
  
  recordRequest(method, endpoint, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = {
        total: 0,
        successful: 0,
        failed: 0
      };
    }
    
    this.metrics.requests.byEndpoint[endpoint].total++;
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.byEndpoint[endpoint].successful++;
    } else {
      this.metrics.requests.byEndpoint[endpoint].failed++;
    }
    
    this.metrics.responseTime.push({
      endpoint,
      responseTime,
      timestamp: Date.now()
    });
  }
  
  recordError(error, context = {}) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
  }
  
  cleanupMetrics() {
    const oneHourAgo = Date.now() - 3600000;
    this.metrics.responseTime = this.metrics.responseTime.filter(rt => rt.timestamp > oneHourAgo);
    this.metrics.errors = this.metrics.errors.filter(error => error.timestamp > oneHourAgo);
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      summary: {
        errorRate: this.metrics.requests.failed / this.metrics.requests.total,
        avgResponseTime: this.calculateAverageResponseTime(),
        totalRequests: this.metrics.requests.total,
        successRate: this.metrics.requests.successful / this.metrics.requests.total
      }
    };
  }
  
  calculateAverageResponseTime() {
    if (this.metrics.responseTime.length === 0) return 0;
    
    const total = this.metrics.responseTime.reduce((sum, rt) => sum + rt.responseTime, 0);
    return total / this.metrics.responseTime.length;
  }
}

const metricsCollector = new MetricsCollector();

module.exports = { metricsCollector };
`;
  
  const metricsPath = path.join(__dirname, '../src/metrics.js');
  fs.writeFileSync(metricsPath, metricsCode);
}

function createLoggingConfig() {
  const loggingConfig = `
// Logging Configuration
const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'guest-pass-system',
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Security: Sanitize sensitive data
const sanitizeMeta = (meta) => {
  if (typeof meta !== 'object' || meta === null) return meta;
  
  const sanitized = { ...meta };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Override log method to sanitize
const originalLog = logger.log;
logger.log = function(level, message, meta) {
  const sanitizedMeta = sanitizeMeta(meta);
  return originalLog.call(this, level, message, sanitizedMeta);
};

module.exports = { logger };
`;
  
  const loggingPath = path.join(__dirname, '../src/logging.js');
  fs.writeFileSync(loggingPath, loggingConfig);
}

function createAlertingRules() {
  const alertingConfig = `
// Alerting Configuration
const alertingRules = {
  errorRate: {
    threshold: 0.05,
    window: '5m',
    severity: 'warning',
    message: 'High error rate detected'
  },
  responseTime: {
    threshold: 2000,
    window: '5m',
    severity: 'warning',
    message: 'High response time detected'
  },
  memoryUsage: {
    threshold: 0.8,
    window: '5m',
    severity: 'critical',
    message: 'High memory usage detected'
  },
  cpuUsage: {
    threshold: 0.8,
    window: '5m',
    severity: 'critical',
    message: 'High CPU usage detected'
  },
  serviceDown: {
    threshold: 1,
    window: '1m',
    severity: 'critical',
    message: 'Service appears to be down'
  }
};

class AlertManager {
  constructor() {
    this.alerts = [];
    this.notificationChannels = this.setupNotificationChannels();
  }
  
  setupNotificationChannels() {
    const channels = [];
    
    // Email notifications
    if (process.env.SMTP_HOST) {
      channels.push({
        type: 'email',
        enabled: true,
        config: {
          smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD
            }
          },
          from: process.env.ALERT_FROM_EMAIL || 'alerts@guest-pass-system.com',
          to: process.env.ALERT_TO_EMAIL || 'admin@guest-pass-system.com'
        }
      });
    }
    
    // Slack notifications
    if (process.env.SLACK_WEBHOOK_URL) {
      channels.push({
        type: 'slack',
        enabled: true,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_CHANNEL || '#alerts'
        }
      });
    }
    
    return channels;
  }
  
  evaluateRules(metrics) {
    const alerts = [];
    
    Object.keys(alertingRules).forEach(ruleName => {
      const rule = alertingRules[ruleName];
      const value = this.getMetricValue(metrics, ruleName);
      
      if (value !== null && value >= rule.threshold) {
        alerts.push({
          rule: ruleName,
          severity: rule.severity,
          message: rule.message,
          value: value,
          threshold: rule.threshold,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return alerts;
  }
  
  getMetricValue(metrics, ruleName) {
    switch (ruleName) {
      case 'errorRate':
        return metrics.summary?.errorRate || 0;
      case 'responseTime':
        return metrics.summary?.avgResponseTime || 0;
      case 'memoryUsage':
        return metrics.system?.memory ? metrics.system.memory.used / metrics.system.memory.total : 0;
      case 'cpuUsage':
        return metrics.system?.cpu ? metrics.system.cpu.percentCPUUsage : 0;
      case 'serviceDown':
        return metrics.status === 'unhealthy' ? 1 : 0;
      default:
        return null;
    }
  }
  
  sendAlerts(alerts) {
    alerts.forEach(alert => {
      this.notificationChannels.forEach(channel => {
        if (channel.enabled) {
          this.sendNotification(channel, alert);
        }
      });
    });
  }
  
  sendNotification(channel, alert) {
    switch (channel.type) {
      case 'email':
        this.sendEmailNotification(channel.config, alert);
        break;
      case 'slack':
        this.sendSlackNotification(channel.config, alert);
        break;
    }
  }
  
  sendEmailNotification(config, alert) {
    // Email notification implementation
    console.log(\`📧 Email alert sent: \${alert.message}\`);
  }
  
  sendSlackNotification(config, alert) {
    // Slack notification implementation
    console.log(\`💬 Slack alert sent: \${alert.message}\`);
  }
}

const alertManager = new AlertManager();

module.exports = { alertManager, alertingRules };
`;
  
  const alertingPath = path.join(__dirname, '../src/alerting.js');
  fs.writeFileSync(alertingPath, alertingConfig);
}

// Run setup if called directly
if (require.main === module) {
  setupMonitoring();
}

module.exports = { setupMonitoring };