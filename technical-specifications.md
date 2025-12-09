# Technical Specifications - Guest Pass Management System

## Technology Stack Details

### Backend Technology Stack

```javascript
// package.json
{
  "name": "guest-pass-backend",
  "version": "1.0.0",
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.3.0",
    "pg": "^8.11.3",              // PostgreSQL client
    "sequelize": "^6.35.0",        // ORM
    "sequelize-typescript": "^2.1.6",
    "redis": "^4.6.11",            // Caching
    "jsonwebtoken": "^9.0.2",      // JWT auth
    "bcrypt": "^5.1.1",            // Password hashing
    "helmet": "^7.1.0",            // Security headers
    "cors": "^2.8.5",              // CORS
    "express-rate-limit": "^7.1.5", // Rate limiting
    "express-validator": "^7.0.1",  // Input validation
    "multer": "^1.4.5-lts.1",      // File upload
    "aws-sdk": "^2.1507.0",        // AWS services
    "qrcode": "^1.5.3",            // QR generation
    "socket.io": "^4.6.1",         // Real-time
    "nodemailer": "^6.9.7",        // Email
    "pdfkit": "^0.14.0",           // PDF generation
    "winston": "^3.11.0",          // Logging
    "joi": "^17.11.0",             // Schema validation
    "dotenv": "^16.3.1"            // Environment vars
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/express": "^4.17.21",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### Frontend Technology Stack

```javascript
// package.json
{
  "name": "guest-pass-frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "typescript": "^5.3.0",
    "@reduxjs/toolkit": "^2.0.0",  // State management
    "react-redux": "^9.0.0",
    "@mui/material": "^5.15.0",    // UI components
    "@mui/icons-material": "^5.15.0",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "socket.io-client": "^4.6.1",  // Real-time
    "axios": "^1.6.2",             // HTTP client
    "react-hook-form": "^7.48.2",  // Forms
    "yup": "^1.3.3",               // Validation
    "date-fns": "^3.0.0",          // Date utilities
    "@fullcalendar/react": "^6.1.10", // Calendar
    "qrcode.react": "^3.1.0",      // QR display
    "html5-qrcode": "^2.3.8",      // QR scanner
    "chart.js": "^4.4.0",          // Charts
    "react-chartjs-2": "^5.2.0",
    "react-toastify": "^9.1.3",    // Notifications
    "workbox-webpack-plugin": "^7.0.0" // PWA
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "cypress": "^13.6.0"
  }
}
```

---

## Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database configuration
│   │   ├── redis.ts             # Redis configuration
│   │   ├── aws.ts               # AWS SDK setup
│   │   └── constants.ts         # App constants
│   ├── models/
│   │   ├── User.ts
│   │   ├── Executive.ts
│   │   ├── Visitor.ts
│   │   ├── Visit.ts
│   │   ├── Pass.ts
│   │   └── AuditLog.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── visitor.controller.ts
│   │   ├── visit.controller.ts
│   │   ├── pass.controller.ts
│   │   └── report.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── visitor.service.ts
│   │   ├── pass.service.ts
│   │   ├── qr.service.ts
│   │   ├── notification.service.ts
│   │   └── report.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT verification
│   │   ├── rbac.middleware.ts   # Role checking
│   │   ├── validation.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── visitor.routes.ts
│   │   ├── visit.routes.ts
│   │   ├── pass.routes.ts
│   │   └── report.routes.ts
│   ├── utils/
│   │   ├── logger.ts            # Winston logger
│   │   ├── encryption.ts        # Crypto utilities
│   │   ├── s3.ts                # S3 operations
│   │   └── email.ts             # Email sender
│   ├── types/
│   │   ├── express.d.ts         # Express types
│   │   └── models.d.ts          # Model types
│   ├── validators/
│   │   ├── visitor.validator.ts
│   │   ├── visit.validator.ts
│   │   └── auth.validator.ts
│   └── app.ts                   # Express app setup
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── migrations/                  # Database migrations
├── seeders/                     # Seed data
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
└── package.json
```

### Frontend Structure

```
frontend/
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── service-worker.js        # Service worker
│   └── icons/                   # App icons
├── src/
│   ├── app/
│   │   ├── store.ts             # Redux store
│   │   └── hooks.ts             # Typed hooks
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authSlice.ts
│   │   │   ├── authAPI.ts
│   │   │   └── Login.tsx
│   │   ├── visitors/
│   │   │   ├── visitorSlice.ts
│   │   │   ├── visitorAPI.ts
│   │   │   ├── VisitorList.tsx
│   │   │   └── VisitorForm.tsx
│   │   ├── visits/
│   │   │   ├── visitSlice.ts
│   │   │   ├── ScheduleVisit.tsx
│   │   │   └── Calendar.tsx
│   │   ├── passes/
│   │   │   ├── QRScanner.tsx
│   │   │   ├── PassDisplay.tsx
│   │   │   └── PassVerify.tsx
│   │   └── dashboard/
│   │       ├── ExecutiveDashboard.tsx
│   │       ├── StaffDashboard.tsx
│   │       └── GuardDashboard.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── forms/
│   │       └── FormField.tsx
│   ├── services/
│   │   ├── api.ts               # Axios instance
│   │   ├── socket.ts            # Socket.io setup
│   │   └── pwa.ts               # PWA utilities
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validation.ts
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── styles/
│   │   ├── theme.ts             # MUI theme
│   │   └── global.css
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.example
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Code Examples

### Backend: Authentication Middleware

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Redis } from 'redis';

interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  executive_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379')
});

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No token provided' }
      });
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JWTPayload;

    // Check if session exists in Redis
    const sessionKey = `session:${decoded.user_id}`;
    const session = await redisClient.get(sessionKey);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: { code: 'SESSION_EXPIRED', message: 'Session expired' }
      });
    }

    // Update last activity
    await redisClient.expire(sessionKey, 86400); // 24 hours

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
      });
    }
    next(error);
  }
};
```

### Backend: RBAC Middleware

```typescript
// src/middleware/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';

type Role = 'super_admin' | 'executive' | 'staff' | 'reception' | 'guard' | 'pso';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        }
      });
    }

    next();
  };
};

// Usage example:
// router.post('/visits', authenticate, requireRole('staff', 'super_admin'), createVisit);
```

### Backend: QR Code Service

```typescript
// src/services/qr.service.ts
import crypto from 'crypto';
import QRCode from 'qrcode';
import { S3 } from 'aws-sdk';

const s3 = new S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const ENCRYPTION_KEY = Buffer.from(process.env.QR_ENCRYPTION_KEY!, 'hex');
const ALGORITHM = 'aes-256-gcm';

interface QRPayload {
  pass_id: string;
  visit_id: string;
  visitor_id: string;
  valid_from: string;
  valid_until: string;
  executive_id: string;
  timestamp: number;
  nonce: string;
}

export class QRService {
  /**
   * Encrypt QR code data
   */
  private static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt QR code data
   */
  static decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate QR code for pass
   */
  static async generateQRCode(pass: any): Promise<string> {
    const payload: QRPayload = {
      pass_id: pass.pass_id,
      visit_id: pass.visit_id,
      visitor_id: pass.visitor_id,
      valid_from: pass.valid_from.toISOString(),
      valid_until: pass.valid_until.toISOString(),
      executive_id: pass.executive_id,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    };

    const encryptedData = this.encrypt(JSON.stringify(payload));
    
    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(encryptedData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    // Upload to S3
    const buffer = Buffer.from(qrDataURL.split(',')[1], 'base64');
    const key = `qr-codes/${pass.pass_id}.png`;

    await s3.putObject({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      ACL: 'private'
    }).promise();

    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return s3Url;
  }

  /**
   * Verify QR code
   */
  static async verifyQRCode(encryptedData: string): Promise<QRPayload> {
    try {
      const decrypted = this.decrypt(encryptedData);
      const payload: QRPayload = JSON.parse(decrypted);

      // Validate timestamp (prevent replay attacks)
      const maxAge = 30000; // 30 seconds
      if (Date.now() - payload.timestamp > maxAge) {
        throw new Error('QR code expired (timestamp too old)');
      }

      // Validate time range
      const now = new Date();
      const validFrom = new Date(payload.valid_from);
      const validUntil = new Date(payload.valid_until);

      if (now < validFrom) {
        throw new Error('Pass not yet valid');
      }

      if (now > validUntil) {
        throw new Error('Pass expired');
      }

      return payload;
    } catch (error) {
      throw new Error(`QR verification failed: ${error.message}`);
    }
  }
}
```

### Frontend: QR Scanner Component

```typescript
// src/features/passes/QRScanner.tsx
import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useDispatch } from 'react-redux';
import { verifyPass } from './passAPI';

interface ScanResult {
  success: boolean;
  visitor_name?: string;
  executive_name?: string;
  message?: string;
  error?: string;
}

const QRScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear();
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    setScanning(true);
    
    try {
      const response = await verifyPass(decodedText);
      
      if (response.success) {
        setResult({
          success: true,
          visitor_name: response.data.visitor_name,
          executive_name: response.data.executive_name,
          message: response.data.message
        });

        // Play success sound
        new Audio('/sounds/success.mp3').play();
      } else {
        setResult({
          success: false,
          error: response.error?.message || 'Verification failed'
        });

        // Play error sound
        new Audio('/sounds/error.mp3').play();
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error. Please try again.'
      });
    } finally {
      setScanning(false);
    }
  };

  const onScanError = (error: any) => {
    // Ignore scan errors (happens frequently during scanning)
    console.warn('Scan error:', error);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Scan Visitor Pass
      </Typography>

      {scanning && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {result && (
        <Alert 
          severity={result.success ? 'success' : 'error'}
          sx={{ mb: 2 }}
        >
          {result.success ? (
            <>
              <Typography variant="h6">
                ✅ Entry Granted
              </Typography>
              <Typography>
                Welcome {result.visitor_name}!
              </Typography>
              <Typography variant="body2">
                Meeting with: {result.executive_name}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6">
                ❌ Access Denied
              </Typography>
              <Typography>{result.error}</Typography>
            </>
          )}
        </Alert>
      )}

      <div id="qr-reader" />
    </Box>
  );
};

export default QRScanner;
```

---

## Database Optimization

### Indexing Strategy

```sql
-- High-frequency query indexes
CREATE INDEX idx_visits_executive_date ON visits(executive_id, scheduled_start_time);
CREATE INDEX idx_visits_status_date ON visits(status, scheduled_start_time);
CREATE INDEX idx_visitors_phone_cnic ON visitors(phone_number, cnic);
CREATE INDEX idx_passes_visit ON passes(visit_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);

-- Composite indexes for common queries
CREATE INDEX idx_visits_lookup ON visits(visitor_id, executive_id, scheduled_start_time);

-- Partial indexes for active records
CREATE INDEX idx_active_passes ON passes(is_active, valid_until) WHERE is_active = true;

-- Full-text search index
CREATE INDEX idx_visitors_search ON visitors USING gin(
  to_tsvector('english', full_name || ' ' || COALESCE(company_name, ''))
);
```

### Query Optimization Examples

```sql
-- Bad: N+1 query problem
SELECT * FROM visits WHERE DATE(scheduled_start_time) = CURRENT_DATE;
-- Then for each visit:
SELECT * FROM visitors WHERE visitor_id = ?;
SELECT * FROM executives WHERE executive_id = ?;

-- Good: Single query with joins
SELECT 
  v.*,
  vis.full_name as visitor_name,
  vis.phone_number,
  e.title as executive_title,
  u.full_name as executive_name
FROM visits v
JOIN visitors vis ON v.visitor_id = vis.visitor_id
JOIN executives e ON v.executive_id = e.executive_id
JOIN users u ON e.user_id = u.user_id
WHERE DATE(v.scheduled_start_time) = CURRENT_DATE;
```

---

## Environment Variables

### Backend .env

```bash
# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.guestpass.grandcity.com.pk

# Database
DB_HOST=grand-city-db.cluster-xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=guest_pass_db
DB_USER=admin
DB_PASSWORD=stored_in_secrets_manager

# Redis
REDIS_HOST=grand-city-cache.xxxxx.0001.use1.cache.amazonaws.com
REDIS_PORT=6379

# JWT
JWT_SECRET=stored_in_secrets_manager
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=stored_in_secrets_manager
AWS_SECRET_ACCESS_KEY=stored_in_secrets_manager
S3_BUCKET_NAME=grand-city-guest-pass

# Encryption
QR_ENCRYPTION_KEY=stored_in_secrets_manager
DATA_ENCRYPTION_KEY=stored_in_secrets_manager

# Email (AWS SES)
EMAIL_FROM=noreply@grandcity.com.pk
SES_REGION=us-east-1

# SMS (AWS SNS)
SNS_REGION=us-east-1
SMS_SENDER_ID=GrandCity

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Frontend .env

```bash
VITE_API_BASE_URL=https://api.guestpass.grandcity.com.pk
VITE_SOCKET_URL=wss://api.guestpass.grandcity.com.pk
VITE_ENVIRONMENT=production
```

---

## Best Practices

### Code Quality

1. **TypeScript Strict Mode:** Always enabled
2. **ESLint:** Enforce code standards
3. **Prettier:** Consistent formatting
4. **Husky:** Pre-commit hooks for linting/testing
5. **Conventional Commits:** Standardized commit messages

### Security Best Practices

1. **Never commit secrets:** Use environment variables
2. **Input validation:** Validate all user inputs
3. **Output encoding:** Prevent XSS attacks
4. **Parameterized queries:** Prevent SQL injection
5. **Rate limiting:** Prevent abuse
6. **HTTPS only:** Enforce TLS
7. **Security headers:** Use Helmet.js
8. **Regular updates:** Keep dependencies updated

### Performance Best Practices

1. **Database connection pooling:** Reuse connections
2. **Redis caching:** Cache frequently accessed data
3. **CDN:** Serve static assets via CloudFront
4. **Lazy loading:** Load components on demand
5. **Image optimization:** Compress and serve WebP
6. **Code splitting:** Reduce initial bundle size
7. **Gzip compression:** Compress API responses

### Testing Best Practices

1. **Unit tests:** >80% coverage
2. **Integration tests:** Critical paths
3. **E2E tests:** User workflows
4. **Performance tests:** Load and stress
5. **Security tests:** OWASP Top 10
6. **Accessibility tests:** WCAG compliance

---

## Monitoring & Observability

### CloudWatch Metrics

```javascript
// Custom metrics to track
const metrics = [
  'APIResponseTime',           // Average response time
  'PassVerificationCount',     // Total pass verifications
  'PassVerificationSuccess',   // Successful verifications
  'PassVerificationFailure',   // Failed verifications
  'WalkInRegistrations',       // Walk-in counts
  'ScheduledVisits',           // Scheduled visit counts
  'ActiveSessions',            // Concurrent users
  'DatabaseConnections',       // Active DB connections
  'CacheHitRatio',            // Redis cache effectiveness
  'FailedLogins',             // Security metric
  'BlacklistScanAttempts'     // Security metric
];
```

### Alerting Rules

```yaml
# CloudWatch Alarms
alarms:
  - name: HighAPILatency
    metric: APIResponseTime
    threshold: 1000ms
    evaluation_periods: 2
    action: email + SMS

  - name: HighErrorRate
    metric: HTTPServerErrors
    threshold: 10 per minute
    action: email + SMS + PagerDuty

  - name: LowDiskSpace
    metric: DiskSpaceUtilization
    threshold: 85%
    action: email

  - name: DatabaseConnectionPool
    metric: DatabaseConnections
    threshold: 80% of max
    action: email
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Technical Lead:** Ali Bin Nadeem  
**Technology Consultant:** Grand City HQ
