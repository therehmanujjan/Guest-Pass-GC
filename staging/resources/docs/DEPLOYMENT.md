# Guest Pass System - Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the Guest Pass System across different environments (development, staging, and production). The system includes QR code generation, multi-role access control, real-time synchronization, and comprehensive monitoring.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Steps](#deployment-steps)
5. [Configuration](#configuration)
6. [Security](#security)
7. [Monitoring](#monitoring)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 16.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: For version control
- **Vercel CLI**: For deployment (install with `npm i -g vercel`)

### Required Environment Variables

Each environment requires specific environment variables to be configured:

#### Production Environment
```bash
PROD_JWT_SECRET=your-jwt-secret-here
PROD_SESSION_SECRET=your-session-secret-here
PROD_DB_PASSWORD=your-database-password
PROD_REDIS_PASSWORD=your-redis-password
PROD_SMTP_HOST=smtp.your-provider.com
PROD_SMTP_PORT=587
PROD_SMTP_USER=your-smtp-user
PROD_SMTP_PASSWORD=your-smtp-password
PROD_SENTRY_DSN=your-sentry-dsn
PROD_GA_TRACKING_ID=your-google-analytics-id
```

#### Staging Environment
```bash
STAGING_JWT_SECRET=your-staging-jwt-secret
STAGING_SESSION_SECRET=your-staging-session-secret
STAGING_SMTP_HOST=staging-smtp-host
STAGING_SMTP_PORT=587
STAGING_SMTP_USER=staging-smtp-user
STAGING_SMTP_PASSWORD=staging-smtp-password
STAGING_SENTRY_DSN=staging-sentry-dsn
STAGING_GA_TRACKING_ID=staging-ga-tracking-id
```

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/guest-pass-system.git
cd guest-pass-system

# Install dependencies
npm install

# Install additional build tools
npm install -g cross-env rimraf
```

### 2. Environment Configuration

Copy the appropriate environment file and configure your variables:

```bash
# For development
cp .env.development .env.local

# For staging
cp .env.staging .env.local

# For production
cp .env.production .env.local
```

Edit `.env.local` with your specific configuration values.

## Build Process

### Development Build

```bash
# Build for development
npm run build:dev

# Serve development build
npm run serve:dev
```

### Staging Build

```bash
# Build for staging
npm run build:staging

# Serve staging build
npm run serve:staging
```

### Production Build

```bash
# Build for production (includes security audit)
npm run build

# Serve production build
npm run serve
```

### Build Process Details

The build process includes:

1. **Security Audit**: Scans for vulnerabilities and security issues
2. **Code Compilation**: Transpiles TypeScript and modern JavaScript
3. **Bundle Optimization**: Minifies and optimizes assets
4. **Dependency Analysis**: Analyzes bundle size and dependencies
5. **Checksum Generation**: Creates integrity checksums for all files
6. **Package Creation**: Creates deployment-ready package

## Deployment Steps

### 1. Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Security audit passed
- [ ] All tests passing
- [ ] Database migrations completed
- [ ] Backup procedures verified
- [ ] Monitoring configured

### 2. Staging Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Verify staging deployment
curl https://guest-pass-staging.vercel.app/health
```

### 3. Production Deployment

```bash
# Deploy to production
npm run deploy

# Verify production deployment
curl https://guest-pass-system.vercel.app/health
```

### 4. Post-deployment Verification

Verify the following endpoints:

- **Health Check**: `https://your-domain.com/health`
- **Metrics**: `https://your-domain.com/metrics`
- **Main Application**: `https://your-domain.com`

## Configuration

### Application Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Application name | "Guest Pass System" |
| `APP_URL` | Application URL | "https://guest-pass-system.vercel.app" |
| `APP_DEBUG` | Debug mode enabled | false |
| `API_TIMEOUT` | API request timeout (ms) | 10000 |

### QR Code Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `QR_CODE_SIZE` | QR code size in pixels | 256 |
| `QR_CODE_MARGIN` | QR code margin | 2 |
| `QR_CODE_ERROR_LEVEL` | Error correction level | "M" |

### Security Settings

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | JWT signing secret | Yes |
| `SESSION_SECRET` | Session encryption secret | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | Yes |

### Monitoring Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | "error" |
| `SENTRY_DSN` | Sentry error tracking DSN | Optional |
| `GA_TRACKING_ID` | Google Analytics tracking ID | Optional |

## Security

### Security Headers

The application includes the following security headers:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: default-src 'self'`

### Content Security Policy

The CSP is configured to allow:
- Scripts from the same origin and Google Tag Manager
- Styles from the same origin and Google Fonts
- Fonts from the same origin and Google Fonts
- Images from the same origin and data URLs
- Connections to the same origin and API endpoints

### Rate Limiting

Rate limiting is configured with:
- Window: 15 minutes
- Max requests: 50 (production), 100 (staging)

## Monitoring

### Health Checks

The application provides a health check endpoint at `/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": "2023-12-07T12:00:00.000Z",
  "uptime": 3600,
  "memory": { "used": 104857600, "total": 536870912 },
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": { "healthy": true, "message": "Database connection active" },
    "redis": { "healthy": true, "message": "Redis connection active" },
    "storage": { "healthy": true, "message": "Storage available" }
  }
}
```

### Metrics

Metrics are available at `/metrics` and include:

- Request counts and response times
- Error rates and types
- System resource usage
- Application-specific metrics

### Logging

Logs are written to:
- `logs/error.log` - Error-level logs only
- `logs/combined.log` - All logs
- Console output for development

### Alerting

Alerts are triggered for:
- Error rate > 5%
- Response time > 2000ms
- Memory usage > 80%
- CPU usage > 80%
- Service down

## Rollback Procedures

### Automatic Rollback

The deployment system includes automatic rollback on failure:

1. Health check failure triggers rollback
2. Previous version is restored
3. Alert is sent to administrators
4. Deployment is marked as failed

### Manual Rollback

To manually rollback to a previous version:

```bash
# List available versions
npm run rollback:list

# Rollback to specific version
npm run rollback --version=1.0.0

# Rollback to previous version
npm run rollback:previous
```

### Rollback Verification

After rollback, verify:

1. Application is accessible
2. Health check passes
3. All features work correctly
4. No data loss occurred

## Troubleshooting

### Common Issues

#### Build Failures

**Issue**: Build fails with syntax errors
**Solution**: 
- Check TypeScript configuration
- Verify all dependencies are installed
- Run `npm run lint` to check for code issues

#### QR Code Generation Issues

**Issue**: QR codes not displaying
**Solution**:
- Check browser console for errors
- Verify QR library is loaded
- Check CSP headers aren't blocking resources

#### Database Connection Issues

**Issue**: Database connection fails
**Solution**:
- Verify connection string
- Check network connectivity
- Confirm credentials are correct

#### Memory Issues

**Issue**: High memory usage
**Solution**:
- Check for memory leaks in application
- Verify proper cleanup of resources
- Consider scaling up resources

### Debug Mode

Enable debug mode by setting `APP_DEBUG=true` in your environment configuration. This provides:

- Detailed error messages
- Stack traces
- Performance metrics
- Request/response logging

### Support

For additional support:

1. Check the logs in `logs/` directory
2. Review the health check endpoint
3. Check monitoring dashboard
4. Contact the development team

## Performance Optimization

### Bundle Analysis

Run bundle analysis:
```bash
npm run build:analyze
```

This generates a detailed report of bundle sizes and dependencies.

### Performance Monitoring

Monitor key metrics:
- Page load times
- API response times
- Error rates
- Resource usage

### Caching Strategy

The application implements:
- Browser caching for static assets
- CDN caching for global distribution
- Application-level caching for frequently accessed data

## Backup and Recovery

### Database Backups

Automated daily backups with 30-day retention.

### File Backups

User uploads and generated files are backed up to cloud storage.

### Disaster Recovery

Full system recovery procedures are documented in `DISASTER_RECOVERY.md`.

## Compliance

### Data Protection

- GDPR compliance implemented
- Data encryption at rest and in transit
- User consent management
- Data retention policies

### Security Standards

- OWASP security guidelines followed
- Regular security audits
- Vulnerability scanning
- Penetration testing

## Contact Information

- **Development Team**: dev-team@your-org.com
- **Operations Team**: ops-team@your-org.com
- **Security Team**: security-team@your-org.com

---

**Last Updated**: December 7, 2025
**Version**: 1.0.0
**Maintained By**: Guest Pass System Team