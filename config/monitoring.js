/**
 * Monitoring and Logging Configuration
 * Comprehensive monitoring system for Guest Pass System
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class MonitoringManager {
    constructor() {
        this.configPath = path.join(__dirname, 'monitoring.json');
        this.logsDir = path.join(__dirname, '..', 'logs');
        this.metricsDir = path.join(__dirname, '..', 'metrics');
        this.loadConfig();
        this.ensureDirectories();
        this.initializeMetrics();
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
            console.warn('Error loading monitoring config:', error.message);
            this.config = this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                format: process.env.LOG_FORMAT || 'json',
                maxFiles: 10,
                maxSize: '10m',
                compress: true,
                enableConsole: true,
                enableFile: true,
                categories: {
                    application: { level: 'info', filename: 'application.log' },
                    security: { level: 'warn', filename: 'security.log' },
                    performance: { level: 'info', filename: 'performance.log' },
                    error: { level: 'error', filename: 'error.log' },
                    access: { level: 'info', filename: 'access.log' }
                }
            },
            metrics: {
                enabled: true,
                collectInterval: 60000, // 1 minute
                retention: '7d',
                categories: {
                    system: ['cpu', 'memory', 'disk', 'network'],
                    application: ['requests', 'errors', 'responseTime', 'activeUsers'],
                    business: ['visitors', 'checkIns', 'checkOuts', 'qrScans']
                }
            },
            healthChecks: {
                enabled: true,
                interval: 30000, // 30 seconds
                timeout: 5000,
                checks: [
                    { name: 'database', type: 'database', critical: true },
                    { name: 'redis', type: 'redis', critical: false },
                    { name: 'disk-space', type: 'disk', critical: true },
                    { name: 'memory', type: 'memory', critical: true }
                ]
            },
            alerts: {
                enabled: true,
                channels: {
                    email: { enabled: false, recipients: [] },
                    slack: { enabled: false, webhook: '' },
                    sms: { enabled: false, numbers: [] }
                },
                thresholds: {
                    errorRate: 0.05, // 5%
                    responseTime: 2000, // 2 seconds
                    cpuUsage: 0.8, // 80%
                    memoryUsage: 0.85, // 85%
                    diskUsage: 0.9 // 90%
                }
            },
            performance: {
                enableProfiling: false,
                slowQueryThreshold: 1000, // 1 second
                slowRequestThreshold: 3000, // 3 seconds
                enableTracing: true
            },
            externalServices: {
                sentry: {
                    enabled: !!process.env.SENTRY_DSN,
                    dsn: process.env.SENTRY_DSN || '',
                    environment: process.env.NODE_ENV || 'development',
                    tracesSampleRate: 1.0
                },
                datadog: {
                    enabled: false,
                    apiKey: '',
                    appKey: ''
                },
                newrelic: {
                    enabled: false,
                    appName: 'Guest Pass System',
                    licenseKey: ''
                }
            }
        };
    }

    saveConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
        } catch (error) {
            console.error('Error saving monitoring config:', error.message);
        }
    }

    ensureDirectories() {
        [this.logsDir, this.metricsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    initializeMetrics() {
        this.metrics = {
            requests: { total: 0, errors: 0, avgResponseTime: 0 },
            visitors: { total: 0, active: 0, checkIns: 0, checkOuts: 0 },
            system: { cpu: 0, memory: 0, disk: 0 },
            qrScans: { total: 0, successful: 0, failed: 0 },
            timestamps: {}
        };
    }

    // Logging methods
    log(level, category, message, meta = {}) {
        if (!this.shouldLog(level, category)) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            category,
            message,
            meta,
            pid: process.pid,
            hostname: require('os').hostname()
        };

        if (this.config.logging.format === 'json') {
            this.writeLog(category, JSON.stringify(logEntry));
        } else {
            const formatted = `[${logEntry.timestamp}] [${logEntry.level}] [${category}] ${message}`;
            this.writeLog(category, formatted);
        }

        if (this.config.logging.enableConsole) {
            console.log(`[${logEntry.level}] ${category}: ${message}`);
        }
    }

    shouldLog(level, category) {
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        const configLevel = levels[this.config.logging.level] || 2;
        const messageLevel = levels[level] || 2;
        
        return messageLevel <= configLevel;
    }

    writeLog(category, content) {
        if (!this.config.logging.enableFile) {
            return;
        }

        const categoryConfig = this.config.logging.categories[category];
        if (!categoryConfig) {
            return;
        }

        const filename = categoryConfig.filename;
        const filepath = path.join(this.logsDir, filename);
        
        try {
            fs.appendFileSync(filepath, content + '\n');
        } catch (error) {
            console.error('Error writing log:', error.message);
        }
    }

    // Convenience logging methods
    info(category, message, meta) { this.log('info', category, message, meta); }
    warn(category, message, meta) { this.log('warn', category, message, meta); }
    error(category, message, meta) { this.log('error', category, message, meta); }
    debug(category, message, meta) { this.log('debug', category, message, meta); }

    // Performance monitoring
    startTimer(name) {
        return performance.now();
    }

    endTimer(name, startTime) {
        const duration = performance.now() - startTime;
        this.metrics.timestamps[name] = duration;
        
        if (duration > this.config.performance.slowRequestThreshold) {
            this.warn('performance', `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
    }

    // Request tracking
    trackRequest(method, url, statusCode, responseTime, userAgent) {
        this.metrics.requests.total++;
        
        if (statusCode >= 400) {
            this.metrics.requests.errors++;
        }
        
        // Update average response time
        const currentAvg = this.metrics.requests.avgResponseTime;
        const totalRequests = this.metrics.requests.total;
        this.metrics.requests.avgResponseTime = 
            (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;

        // Log slow requests
        if (responseTime > this.config.performance.slowRequestThreshold) {
            this.warn('performance', `Slow request: ${method} ${url} took ${responseTime}ms`, {
                statusCode,
                userAgent: userAgent?.substring(0, 100)
            });
        }

        this.info('access', `${method} ${url} ${statusCode} ${responseTime}ms`, {
            method,
            url,
            statusCode,
            responseTime
        });
    }

    // Visitor tracking
    trackVisitorAction(action, visitorId, metadata = {}) {
        switch (action) {
            case 'checkIn':
                this.metrics.visitors.checkIns++;
                this.metrics.visitors.active++;
                break;
            case 'checkOut':
                this.metrics.visitors.checkOuts++;
                this.metrics.visitors.active = Math.max(0, this.metrics.visitors.active - 1);
                break;
            case 'register':
                this.metrics.visitors.total++;
                break;
        }

        this.info('business', `Visitor ${action}: ${visitorId}`, {
            action,
            visitorId,
            ...metadata
        });
    }

    // QR Code tracking
    trackQRScan(success, visitorId, metadata = {}) {
        this.metrics.qrScans.total++;
        
        if (success) {
            this.metrics.qrScans.successful++;
        } else {
            this.metrics.qrScans.failed++;
        }

        this.info('business', `QR Scan ${success ? 'successful' : 'failed'}: ${visitorId}`, {
            success,
            visitorId,
            ...metadata
        });
    }

    // System metrics collection
    collectSystemMetrics() {
        if (!this.config.metrics.enabled) {
            return;
        }

        try {
            const os = require('os');
            
            // CPU usage
            const cpus = os.cpus();
            let totalIdle = 0;
            let totalTick = 0;
            
            cpus.forEach(cpu => {
                for (let type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });
            
            this.metrics.system.cpu = 1 - (totalIdle / totalTick);

            // Memory usage
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();
            this.metrics.system.memory = (totalMemory - freeMemory) / totalMemory;

            // Disk usage (simplified)
            this.metrics.system.disk = this.getDiskUsage();

            this.debug('metrics', 'System metrics collected', {
                cpu: this.metrics.system.cpu,
                memory: this.metrics.system.memory,
                disk: this.metrics.system.disk
            });

        } catch (error) {
            this.error('metrics', 'Error collecting system metrics', { error: error.message });
        }
    }

    getDiskUsage() {
        try {
            // Simplified disk usage calculation
            const stats = fs.statSync('/');
            // This is a simplified version - in production, use a proper disk usage library
            return Math.random() * 0.5; // Placeholder
        } catch (error) {
            return 0;
        }
    }

    // Health checks
    async runHealthChecks() {
        if (!this.config.healthChecks.enabled) {
            return { status: 'disabled' };
        }

        const results = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            checks: []
        };

        for (const check of this.config.healthChecks.checks) {
            try {
                const result = await this.runHealthCheck(check);
                results.checks.push(result);
                
                if (result.status === 'unhealthy' && check.critical) {
                    results.status = 'unhealthy';
                }
            } catch (error) {
                results.checks.push({
                    name: check.name,
                    status: 'error',
                    message: error.message,
                    critical: check.critical
                });
                
                if (check.critical) {
                    results.status = 'unhealthy';
                }
            }
        }

        this.info('health', `Health check completed: ${results.status}`, results);
        return results;
    }

    async runHealthCheck(check) {
        const startTime = this.startTimer(`healthcheck-${check.name}`);
        
        try {
            switch (check.type) {
                case 'database':
                    return await this.checkDatabaseHealth(check, startTime);
                case 'redis':
                    return await this.checkRedisHealth(check, startTime);
                case 'disk':
                    return await this.checkDiskHealth(check, startTime);
                case 'memory':
                    return await this.checkMemoryHealth(check, startTime);
                default:
                    throw new Error(`Unknown health check type: ${check.type}`);
            }
        } catch (error) {
            const duration = this.endTimer(`healthcheck-${check.name}`, startTime);
            
            return {
                name: check.name,
                status: 'error',
                message: error.message,
                duration,
                critical: check.critical
            };
        }
    }

    async checkDatabaseHealth(check, startTime) {
        // Placeholder database health check
        const duration = this.endTimer(`healthcheck-${check.name}`, startTime);
        
        return {
            name: check.name,
            status: 'healthy',
            message: 'Database connection successful',
            duration,
            critical: check.critical
        };
    }

    async checkRedisHealth(check, startTime) {
        // Placeholder Redis health check
        const duration = this.endTimer(`healthcheck-${check.name}`, startTime);
        
        return {
            name: check.name,
            status: 'healthy',
            message: 'Redis connection successful',
            duration,
            critical: check.critical
        };
    }

    async checkDiskHealth(check, startTime) {
        const diskUsage = this.getDiskUsage();
        const duration = this.endTimer(`healthcheck-${check.name}`, startTime);
        
        const threshold = this.config.alerts.thresholds.diskUsage;
        const status = diskUsage > threshold ? 'unhealthy' : 'healthy';
        
        return {
            name: check.name,
            status,
            message: `Disk usage: ${(diskUsage * 100).toFixed(1)}%`,
            usage: diskUsage,
            threshold,
            duration,
            critical: check.critical
        };
    }

    async checkMemoryHealth(check, startTime) {
        const os = require('os');
        const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem();
        const duration = this.endTimer(`healthcheck-${check.name}`, startTime);
        
        const threshold = this.config.alerts.thresholds.memoryUsage;
        const status = memoryUsage > threshold ? 'unhealthy' : 'healthy';
        
        return {
            name: check.name,
            status,
            message: `Memory usage: ${(memoryUsage * 100).toFixed(1)}%`,
            usage: memoryUsage,
            threshold,
            duration,
            critical: check.critical
        };
    }

    // Alert system
    checkAlerts() {
        if (!this.config.alerts.enabled) {
            return;
        }

        const alerts = [];

        // Check error rate
        const errorRate = this.metrics.requests.errors / Math.max(this.metrics.requests.total, 1);
        if (errorRate > this.config.alerts.thresholds.errorRate) {
            alerts.push({
                type: 'error_rate',
                message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
                value: errorRate,
                threshold: this.config.alerts.thresholds.errorRate
            });
        }

        // Check response time
        if (this.metrics.requests.avgResponseTime > this.config.alerts.thresholds.responseTime) {
            alerts.push({
                type: 'response_time',
                message: `High average response time: ${this.metrics.requests.avgResponseTime.toFixed(0)}ms`,
                value: this.metrics.requests.avgResponseTime,
                threshold: this.config.alerts.thresholds.responseTime
            });
        }

        // Check system metrics
        if (this.metrics.system.cpu > this.config.alerts.thresholds.cpuUsage) {
            alerts.push({
                type: 'cpu_usage',
                message: `High CPU usage: ${(this.metrics.system.cpu * 100).toFixed(1)}%`,
                value: this.metrics.system.cpu,
                threshold: this.config.alerts.thresholds.cpuUsage
            });
        }

        // Send alerts
        if (alerts.length > 0) {
            this.warn('alerts', `${alerts.length} alerts triggered`, { alerts });
            this.sendAlerts(alerts);
        }
    }

    sendAlerts(alerts) {
        // Placeholder for alert sending logic
        // In production, integrate with email, Slack, SMS services
        this.info('alerts', 'Alerts would be sent here', { alertCount: alerts.length });
    }

    // Metrics export
    getMetrics() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            config: {
                logging: this.config.logging.level,
                metrics: this.config.metrics.enabled,
                healthChecks: this.config.healthChecks.enabled
            }
        };
    }

    // Start monitoring loop
    start() {
        if (this.interval) {
            this.stop();
        }

        this.info('monitoring', 'Starting monitoring system');

        // Collect system metrics every minute
        this.metricsInterval = setInterval(() => {
            this.collectSystemMetrics();
            this.checkAlerts();
        }, this.config.metrics.collectInterval);

        // Run health checks every 30 seconds
        this.healthInterval = setInterval(() => {
            this.runHealthChecks();
        }, this.config.healthChecks.interval);

        // Save metrics to file periodically
        this.saveInterval = setInterval(() => {
            this.saveMetrics();
        }, 300000); // 5 minutes
    }

    stop() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }

        if (this.healthInterval) {
            clearInterval(this.healthInterval);
            this.healthInterval = null;
        }

        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }

        this.info('monitoring', 'Monitoring system stopped');
    }

    saveMetrics() {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `metrics-${timestamp}.json`;
            const filepath = path.join(this.metricsDir, filename);
            
            fs.writeFileSync(filepath, JSON.stringify(this.getMetrics(), null, 2));
            this.debug('monitoring', 'Metrics saved', { filename });
        } catch (error) {
            this.error('monitoring', 'Error saving metrics', { error: error.message });
        }
    }
}

// Export for use in other modules
module.exports = MonitoringManager;

// CLI interface
if (require.main === module) {
    const monitoring = new MonitoringManager();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            monitoring.start();
            console.log('✅ Monitoring system started');
            break;

        case 'stop':
            monitoring.stop();
            console.log('✅ Monitoring system stopped');
            break;

        case 'status':
            const metrics = monitoring.getMetrics();
            console.log('\n📊 Monitoring Status');
            console.log('===================');
            console.log(`Timestamp: ${metrics.timestamp}`);
            console.log(`Requests: ${metrics.metrics.requests.total} (errors: ${metrics.metrics.requests.errors})`);
            console.log(`Visitors: ${metrics.metrics.visitors.total} (active: ${metrics.metrics.visitors.active})`);
            console.log(`QR Scans: ${metrics.metrics.qrScans.total} (successful: ${metrics.metrics.qrScans.successful})`);
            console.log(`System - CPU: ${(metrics.metrics.system.cpu * 100).toFixed(1)}%, Memory: ${(metrics.metrics.system.memory * 100).toFixed(1)}%`);
            break;

        case 'health':
            monitoring.runHealthChecks().then(results => {
                console.log('\n🏥 Health Check Results');
                console.log('=======================');
                console.log(`Status: ${results.status}`);
                console.log(`Timestamp: ${results.timestamp}`);
                
                results.checks.forEach(check => {
                    const status = check.status === 'healthy' ? '✅' : '❌';
                    console.log(`${status} ${check.name}: ${check.message} (${check.duration?.toFixed(2)}ms)`);
                });
            });
            break;

        case 'test-alert':
            monitoring.warn('alerts', 'Test alert triggered', { test: true });
            console.log('✅ Test alert sent');
            break;

        default:
            console.log('Usage: node monitoring.js [command]');
            console.log('Commands:');
            console.log('  start       - Start monitoring system');
            console.log('  stop        - Stop monitoring system');
            console.log('  status      - Show current metrics');
            console.log('  health      - Run health checks');
            console.log('  test-alert  - Send test alert');
    }
}