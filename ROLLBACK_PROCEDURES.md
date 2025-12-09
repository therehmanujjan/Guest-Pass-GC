# Rollback Procedures

## Overview

This document outlines the comprehensive rollback procedures for the Guest Pass System deployment. These procedures ensure safe and efficient rollback to previous versions in case of deployment issues.

## Table of Contents

1. [Rollback Triggers](#rollback-triggers)
2. [Pre-Rollback Checklist](#pre-rollback-checklist)
3. [Rollback Procedures](#rollback-procedures)
4. [Post-Rollback Verification](#post-rollback-verification)
5. [Emergency Rollback](#emergency-rollback)
6. [Rollback Automation](#rollback-automation)
7. [Communication Protocol](#communication-protocol)
8. [Rollback Testing](#rollback-testing)

## Rollback Triggers

### Automatic Rollback Triggers

The following conditions will automatically trigger a rollback:

- **Health Check Failures**: 3 consecutive health check failures within 5 minutes
- **Error Rate Threshold**: Error rate exceeds 5% for more than 2 minutes
- **Performance Degradation**: Response time exceeds 2000ms for more than 5 minutes
- **Database Connection Failures**: Unable to connect to database for more than 1 minute
- **Security Vulnerabilities**: Detection of critical security issues

### Manual Rollback Triggers

Manual rollback should be initiated when:

- User-reported critical bugs affecting core functionality
- Data integrity issues
- Feature malfunctions in production
- Performance issues affecting user experience
- Security concerns raised by monitoring systems

## Pre-Rollback Checklist

### 1. Issue Assessment

- [ ] Identify the root cause of the issue
- [ ] Determine if rollback is the appropriate solution
- [ ] Assess the scope of the issue (partial vs. full rollback)
- [ ] Document the issue for post-mortem analysis

### 2. Stakeholder Notification

- [ ] Notify development team
- [ ] Alert operations team
- [ ] Inform customer support team
- [ ] Update status page if applicable

### 3. Backup Verification

- [ ] Verify latest backup availability
- [ ] Confirm backup integrity
- [ ] Ensure rollback target version is available
- [ ] Validate rollback scripts are ready

## Rollback Procedures

### Standard Rollback Procedure

#### Step 1: Prepare Rollback Environment

```bash
# Navigate to deployment directory
cd /opt/guest-pass-system

# Check current version
cat VERSION

# List available versions
ls -la releases/

# Identify rollback target version
export ROLLBACK_VERSION="v1.0.0"
```

#### Step 2: Execute Database Rollback

```bash
# Backup current database state
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply database rollback scripts
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < rollback_scripts/rollback_${ROLLBACK_VERSION}.sql

# Verify database integrity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM visitors;"
```

#### Step 3: Application Rollback

```bash
# Stop current application
sudo systemctl stop guest-pass-system

# Backup current application files
cp -r current/ backup_$(date +%Y%m%d_%H%M%S)/

# Restore previous version
cp -r releases/${ROLLBACK_VERSION}/* current/

# Update version file
echo $ROLLBACK_VERSION > current/VERSION

# Set proper permissions
chown -R app:app current/
chmod -R 755 current/
```

#### Step 4: Configuration Rollback

```bash
# Restore previous configuration
cp config/backup_${ROLLBACK_VERSION}.env current/.env

# Verify configuration
node scripts/verify-config.js current/.env

# Update environment variables
source current/.env
```

#### Step 5: Restart Services

```bash
# Start application
sudo systemctl start guest-pass-system

# Check service status
sudo systemctl status guest-pass-system

# Monitor logs
tail -f /var/log/guest-pass-system/app.log
```

### Vercel Rollback Procedure

#### Using Vercel CLI

```bash
# List deployment history
vercel ls guest-pass-system

# Identify rollback target deployment
export ROLLBACK_DEPLOYMENT="dpl_xxxxxxxxxxxxxxxxxxxxx"

# Promote previous deployment
vercel promote $ROLLBACK_DEPLOYMENT

# Verify rollback
vercel inspect $ROLLBACK_DEPLOYMENT
```

#### Using Vercel Dashboard

1. Navigate to Vercel Dashboard
2. Select the Guest Pass System project
3. Go to "Deployments" tab
4. Find the target rollback deployment
5. Click "Promote to Production"
6. Verify deployment status

### Docker Rollback Procedure

#### Using Docker Compose

```bash
# Stop current containers
docker-compose down

# List available images
docker images | grep guest-pass-system

# Tag rollback image
docker tag guest-pass-system:${ROLLBACK_VERSION} guest-pass-system:latest

# Start with rollback version
docker-compose up -d

# Verify containers are running
docker-compose ps

# Check logs
docker-compose logs -f
```

#### Using Kubernetes

```bash
# List available deployments
kubectl get deployments

# Rollback to previous version
kubectl rollout undo deployment/guest-pass-system

# Check rollout status
kubectl rollout status deployment/guest-pass-system

# Verify pods are running
kubectl get pods -l app=guest-pass-system
```

## Post-Rollback Verification

### 1. Application Health Check

- [ ] Verify application is accessible
- [ ] Check all user roles and permissions
- [ ] Test core functionality (visitor registration, QR generation)
- [ ] Verify database connectivity
- [ ] Check external service integrations

### 2. Performance Verification

- [ ] Monitor response times
- [ ] Check resource utilization
- [ ] Verify concurrent user handling
- [ ] Test peak load performance

### 3. Data Integrity Check

- [ ] Verify visitor data consistency
- [ ] Check audit logs
- [ ] Validate user accounts
- [ ] Test data export/import functionality

### 4. Security Verification

- [ ] Verify authentication systems
- [ ] Check authorization controls
- [ ] Test security headers
- [ ] Validate encryption settings

## Emergency Rollback

### Immediate Actions (Within 5 minutes)

1. **Stop Current Deployment**
   ```bash
   sudo systemctl stop guest-pass-system
   ```

2. **Activate Emergency Rollback**
   ```bash
   # Use emergency rollback script
   ./scripts/emergency-rollback.sh
   ```

3. **Verify Basic Functionality**
   ```bash
   # Quick health check
   curl -f http://localhost:3000/health || echo "Health check failed"
   ```

### Emergency Rollback Script

```bash
#!/bin/bash
# emergency-rollback.sh

set -e

echo "🚨 Initiating emergency rollback..."

# Stop all services
sudo systemctl stop guest-pass-system
sudo systemctl stop nginx

# Restore from emergency backup
cp -r /opt/emergency-backup/current /opt/guest-pass-system/

# Update configuration
cp /opt/emergency-backup/.env /opt/guest-pass-system/current/

# Restart services
sudo systemctl start guest-pass-system
sudo systemctl start nginx

echo "✅ Emergency rollback completed"
```

## Rollback Automation

### Automated Rollback Script

```bash
#!/bin/bash
# automated-rollback.sh

set -e

ROLLBACK_VERSION=$1
if [ -z "$ROLLBACK_VERSION" ]; then
    echo "Usage: $0 <rollback_version>"
    exit 1
fi

echo "🔄 Starting automated rollback to $ROLLBACK_VERSION..."

# Pre-rollback checks
./scripts/pre-rollback-checks.sh

# Database rollback
./scripts/rollback-database.sh $ROLLBACK_VERSION

# Application rollback
./scripts/rollback-application.sh $ROLLBACK_VERSION

# Configuration rollback
./scripts/rollback-configuration.sh $ROLLBACK_VERSION

# Post-rollback verification
./scripts/post-rollback-verification.sh

echo "✅ Automated rollback completed successfully"
```

### Monitoring Integration

```javascript
// rollback-monitor.js
const monitoring = require('./monitoring');

async function monitorRollback() {
    const metrics = {
        rollbackStartTime: Date.now(),
        rollbackVersion: process.env.ROLLBACK_VERSION,
        previousVersion: process.env.PREVIOUS_VERSION
    };
    
    try {
        // Monitor application health
        const health = await checkApplicationHealth();
        
        if (!health.healthy) {
            await monitoring.alert('Rollback health check failed', {
                severity: 'critical',
                metrics
            });
        }
        
        // Log rollback metrics
        await monitoring.log('rollback_completed', metrics);
        
    } catch (error) {
        await monitoring.alert('Rollback monitoring failed', {
            severity: 'critical',
            error: error.message
        });
    }
}
```

## Communication Protocol

### Internal Communication

1. **Immediate Notification**
   - Slack: #engineering-alerts
   - Email: engineering-team@company.com
   - SMS: On-call engineer

2. **Stakeholder Updates**
   - Product Manager
   - Operations Team
   - Customer Support
   - Management

3. **Customer Communication**
   - Status page update
   - Customer notification (if applicable)
   - Social media updates (if widespread impact)

### Communication Templates

#### Rollback Initiation

```
Subject: [URGENT] Guest Pass System Rollback Initiated

The Guest Pass System rollback has been initiated due to [REASON].

- Rollback Version: [VERSION]
- Start Time: [TIME]
- Estimated Duration: [DURATION]
- Incident Commander: [NAME]

We will provide updates every 15 minutes until resolution.
```

#### Rollback Completion

```
Subject: [RESOLVED] Guest Pass System Rollback Completed

The Guest Pass System rollback has been completed successfully.

- Completion Time: [TIME]
- Current Version: [VERSION]
- Status: All systems operational
- Post-rollout monitoring: Active

Thank you for your patience.
```

## Rollback Testing

### Regular Rollback Drills

- **Frequency**: Monthly
- **Scope**: Full rollback procedure
- **Participants**: Engineering team, Operations team
- **Documentation**: Post-drill analysis and improvements

### Test Scenarios

1. **Complete System Rollback**
   - Full application and database rollback
   - Data integrity verification
   - Performance validation

2. **Partial Rollback**
   - Configuration-only rollback
   - Database-only rollback
   - Application-only rollback

3. **Emergency Rollback**
   - Time-constrained rollback
   - Minimal verification steps
   - Critical functionality testing

### Rollback Test Checklist

- [ ] Backup restoration
- [ ] Database integrity
- [ ] Application functionality
- [ ] Performance metrics
- [ ] Security validation
- [ ] User acceptance testing
- [ ] Monitoring system validation

## Rollback Metrics

### Key Performance Indicators (KPIs)

- **Rollback Time**: Target < 15 minutes for standard rollback
- **Success Rate**: Target > 95% success rate
- **Data Integrity**: 100% data consistency post-rollback
- **Service Availability**: > 99.9% availability during rollback

### Monitoring and Alerting

- Real-time rollback progress tracking
- Automated failure detection
- Immediate escalation procedures
- Post-rollback performance monitoring

## Conclusion

These rollback procedures ensure the Guest Pass System can be safely and efficiently rolled back to previous versions when necessary. Regular testing and updates of these procedures are essential for maintaining system reliability and minimizing downtime.

For questions or updates to these procedures, contact the engineering team or create an issue in the project repository.