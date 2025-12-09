# Security Architecture & RBAC - Guest Pass Management System

## Security Overview

The Guest Pass Management System implements defense-in-depth security principles with multiple layers of protection to ensure data confidentiality, integrity, and availability.

---

## Role-Based Access Control (RBAC)

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                       │
└─────────────────────────────────────────────────────────┘

        Super Admin (Ali Bin Nadeem)
               │
        ┌──────┴──────────────┐
        │                     │
    Executive           Admin Staff
  (C-Level: 7)              │
        │            ┌───────┴────────┐
        │            │                │
        │         Staff/EA         Reception
        │       (Assistants)           │
        │            │                 │
        └────────────┴─────────────────┤
                                       │
                            ┌──────────┴──────────┐
                            │                     │
                          Guard                 PSO
                    (Security Guards)  (Personal Security)
```

### Role Definitions

#### 1. Super Admin
**Users:** Technology Consultant (Ali Bin Nadeem)

**Permissions:**
- ✅ Full system access
- ✅ User management (create, edit, delete, suspend)
- ✅ System configuration and settings
- ✅ Blacklist management
- ✅ Audit log access (all activities)
- ✅ Database backup/restore
- ✅ Security settings management
- ✅ API key management
- ✅ Role and permission configuration
- ✅ System health monitoring
- ✅ Emergency system override

**Access Scope:** Global (all data, all executives, all locations)

#### 2. Executive
**Users:** 7 C-Level Leaders (Salman, Rehan, Khalid, etc.)

**Permissions:**
- ✅ View own schedule and appointments
- ✅ Approve/reject walk-in requests for themselves
- ✅ View visitor history (own meetings)
- ✅ Generate personal reports
- ✅ Manage own calendar preferences
- ✅ View executive dashboard
- ✅ Access analytics (own data)
- ❌ Cannot modify other executives' data
- ❌ Cannot access system settings
- ❌ Cannot manage users

**Access Scope:** Own data only (own visits, own schedule)

**Special Rules:**
- Chairman Partner (Rehan) & CEO (Khalid): Can view all executives' schedules (read-only)
- Director Operations (Shahnawaz): Can view all operational data

#### 3. Staff / Executive Assistant (EA)
**Users:** Administrative staff assigned to executives

**Permissions:**
- ✅ Schedule visits for assigned executive(s)
- ✅ Manage visitor pre-registration
- ✅ View assigned executive's schedule
- ✅ Cancel/modify visits (own created)
- ✅ Generate passes
- ✅ Send notifications
- ✅ Search visitor history
- ✅ Upload visitor documents
- ✅ View basic reports
- ❌ Cannot approve/reject (must get executive approval)
- ❌ Cannot access other executives' data
- ❌ Cannot modify system settings

**Access Scope:** Assigned executive(s) data only

#### 4. Reception / Admin
**Users:** Front desk staff, admin coordinators

**Permissions:**
- ✅ Register walk-in visitors
- ✅ View today's scheduled visits (all executives)
- ✅ Verify pass validity
- ✅ Send approval requests to executives
- ✅ Check-in/check-out visitors
- ✅ Search visitors
- ✅ View location-specific data
- ❌ Cannot schedule visits
- ❌ Cannot approve walk-ins
- ❌ Cannot modify visits
- ❌ Cannot access historical reports

**Access Scope:** Current day data, assigned location

#### 5. Guard / Security
**Users:** Security personnel at entry points

**Permissions:**
- ✅ Scan QR codes
- ✅ Register walk-ins (basic info)
- ✅ Check-in/check-out visitors
- ✅ View today's expected visitors
- ✅ Send emergency alerts
- ✅ Take visitor photos
- ✅ View blacklist status
- ❌ Cannot approve walk-ins
- ❌ Cannot schedule visits
- ❌ Cannot modify visitor data
- ❌ Cannot access reports

**Access Scope:** Current day data, assigned location, read-only

#### 6. PSO (Personal Security Officer)
**Users:** Personal security for specific executives

**Permissions:**
- Same as Guard, plus:
- ✅ View assigned executive's schedule
- ✅ Receive real-time notifications for assigned executive
- ✅ Priority alert system
- ✅ Direct communication channel

**Access Scope:** Assigned executive's data, current day

---

## Permission Matrix

### Feature Access by Role

| Feature | Super Admin | Executive | Staff/EA | Reception | Guard | PSO |
|---------|------------|-----------|----------|-----------|-------|-----|
| **Dashboard** |
| View Executive Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Staff Dashboard | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| View Guard Dashboard | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Visitors** |
| Search Visitors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Visitor | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit Visitor | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Delete Visitor | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Upload Visitor Photo | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Visits** |
| Schedule Visit | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Own Schedule | ✅ | ✅ | ✅* | ❌ | ❌ | ✅* |
| View All Schedules | ✅ | ❌** | ❌ | ❌ | ❌ | ❌ |
| Modify Visit | ✅ | ❌ | ✅† | ❌ | ❌ | ❌ |
| Cancel Visit | ✅ | ✅ | ✅† | ❌ | ❌ | ❌ |
| **Walk-ins** |
| Register Walk-in | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve Walk-in | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Passes** |
| Generate Pass | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Verify Pass (QR) | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Revoke Pass | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Check-in/out** |
| Check-in Visitor | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Check-out Visitor | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Reports** |
| Weekly Scrutiny | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Executive Reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Operational Reports | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Audit Logs | ✅ | ✅‡ | ❌ | ❌ | ❌ | ❌ |
| **Blacklist** |
| View Blacklist | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add to Blacklist | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove from Blacklist | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **System** |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Backup/Restore | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full Access
- ❌ No Access
- \* Only for assigned executive(s)
- \*\* Chairman & CEO have read-only access to all
- † Only visits they created
- ‡ Only own activity logs

---

## Authentication & Session Management

### Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│              AUTHENTICATION SEQUENCE                    │
└─────────────────────────────────────────────────────────┘

1. User submits credentials
   ↓
2. System validates email format
   ↓
3. Query database for user account
   ↓
4. Check account status
   ├─ Inactive → Reject (401)
   ├─ Locked → Check lock expiry
   │            ├─ Still locked → Reject (403)
   │            └─ Expired → Reset counter, continue
   └─ Active → Continue
   ↓
5. Verify password hash (bcrypt)
   ├─ Invalid → Increment fail counter
   │            ├─ Counter < 5 → Reject (401)
   │            └─ Counter ≥ 5 → Lock account, Reject (403)
   └─ Valid → Continue
   ↓
6. Generate JWT tokens
   ├─ Access Token (24h)
   └─ Refresh Token (7d)
   ↓
7. Store session in Redis
   ├─ Session ID
   ├─ User ID
   ├─ Role
   ├─ IP Address
   ├─ User Agent
   └─ Created At
   ↓
8. Log audit event
   ↓
9. Return tokens to client
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "u3333333-3333-3333-3333-333333333333",
    "email": "khalid.noon@grandcity.com.pk",
    "role": "executive",
    "permissions": ["approve_walkins", "view_reports"],
    "executive_id": "e3333333-3333-3333-3333-333333333333",
    "iat": 1735603200,
    "exp": 1735689600
  },
  "signature": "..."
}
```

### Session Management

#### Session Storage (Redis)

```
Key: session:{session_id}
Value: {
  user_id: "uuid",
  role: "executive",
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0...",
  created_at: "2024-12-04T10:00:00Z",
  last_activity: "2024-12-04T14:30:00Z"
}
TTL: 86400 seconds (24 hours)
```

#### Session Validation

Every API request:
1. Extract JWT from Authorization header
2. Verify JWT signature
3. Check JWT expiry
4. Verify session exists in Redis
5. Update last_activity timestamp
6. Proceed with request

#### Session Termination

- **Automatic:** After 24 hours of inactivity
- **Manual:** User logout
- **Forced:** Admin can revoke sessions
- **Global:** User password change revokes all sessions

---

## Data Encryption

### Encryption at Rest

#### Database Encryption
- **Method:** AES-256-GCM
- **Scope:** Entire RDS database
- **Key Management:** AWS KMS (Customer Managed Keys)
- **Rotation:** Automatic annual key rotation

#### Field-Level Encryption (PII)
Sensitive fields encrypted before storage:
- CNIC numbers
- Passport numbers
- Phone numbers (optional)
- Email addresses (optional)

**Algorithm:** AES-256-CBC
**Library:** Node.js `crypto` module
**Key Storage:** AWS Secrets Manager

```javascript
// Example: Encrypting CNIC
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const iv = crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
```

### Encryption in Transit

#### TLS/SSL Configuration
- **Protocol:** TLS 1.3 (minimum TLS 1.2)
- **Certificate:** AWS Certificate Manager (ACM)
- **Cipher Suites:** 
  - TLS_AES_128_GCM_SHA256
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256
- **HSTS:** Enabled with max-age=31536000

#### API Communication
All API endpoints enforce HTTPS:
```
http://api.guestpass.grandcity.com.pk → 
https://api.guestpass.grandcity.com.pk (301 Redirect)
```

### Password Security

#### Hashing Algorithm
- **Algorithm:** bcrypt
- **Salt Rounds:** 12
- **Min Length:** 8 characters
- **Requirements:**
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character

```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;

async function hashPassword(plaintext) {
  return await bcrypt.hash(plaintext, saltRounds);
}

async function verifyPassword(plaintext, hash) {
  return await bcrypt.compare(plaintext, hash);
}
```

#### Password Policies
- **Expiry:** 90 days for admins, 180 days for others
- **History:** Cannot reuse last 5 passwords
- **Complexity:** Enforced by backend validation
- **Lockout:** 5 failed attempts → 30-minute lock

---

## QR Code Security

### QR Code Generation

```javascript
const qrData = {
  pass_id: "pass123-uuid",
  visit_id: "visit456-uuid",
  visitor_id: "visitor789-uuid",
  valid_from: "2024-12-10T13:00:00Z",
  valid_until: "2024-12-10T18:00:00Z",
  executive_id: "exec111-uuid",
  timestamp: Date.now(),
  nonce: crypto.randomBytes(16).toString('hex')
};

// Encrypt QR data
const qrToken = encrypt(JSON.stringify(qrData));

// Generate QR code
const qrCodeImage = await QRCode.toDataURL(qrToken);
```

### QR Code Validation

```javascript
async function validateQRCode(qrToken) {
  // 1. Decrypt token
  const qrData = JSON.parse(decrypt(qrToken));
  
  // 2. Validate timestamp (prevent replay attacks)
  const maxAge = 30000; // 30 seconds
  if (Date.now() - qrData.timestamp > maxAge) {
    throw new Error('QR code expired');
  }
  
  // 3. Verify pass in database
  const pass = await db.passes.findById(qrData.pass_id);
  
  // 4. Validate pass status
  if (!pass.is_active) throw new Error('Pass revoked');
  if (Date.now() < pass.valid_from) throw new Error('Pass not yet valid');
  if (Date.now() > pass.valid_until) throw new Error('Pass expired');
  
  // 5. Check visitor blacklist
  const visitor = await db.visitors.findById(qrData.visitor_id);
  if (visitor.is_blacklisted) throw new Error('Visitor blacklisted');
  
  // 6. Verify entry count
  if (pass.entries_used >= pass.max_entries) {
    throw new Error('Max entries exceeded');
  }
  
  return { valid: true, pass, visitor };
}
```

### Anti-Tampering Measures

1. **Encrypted Payload:** QR contains encrypted JSON, not plain text
2. **Timestamp Validation:** QR valid for 30 seconds after generation
3. **Nonce:** Unique random value prevents QR duplication
4. **Database Verification:** Always cross-check with live database
5. **Single-Use Enforcement:** Track scan count

---

## Audit & Logging

### Audit Trail Requirements

**WCRF (Who, What, When, Where, Why)**

Every action logs:
- **Who:** User ID, role, email
- **What:** Action type (CREATE, UPDATE, DELETE, APPROVE, etc.)
- **When:** ISO 8601 timestamp
- **Where:** IP address, location, device
- **Why:** Context (entity type, entity ID, changes)

### Audit Event Types

```
AUTHENTICATION
├─ LOGIN_SUCCESS
├─ LOGIN_FAILED
├─ LOGOUT
├─ PASSWORD_CHANGE
└─ SESSION_EXPIRED

VISITOR_MANAGEMENT
├─ VISITOR_CREATED
├─ VISITOR_UPDATED
├─ VISITOR_DELETED
└─ VISITOR_BLACKLISTED

VISIT_MANAGEMENT
├─ VISIT_SCHEDULED
├─ VISIT_UPDATED
├─ VISIT_CANCELLED
├─ WALKIN_REGISTERED
├─ WALKIN_APPROVED
├─ WALKIN_REJECTED
├─ VISITOR_CHECKED_IN
└─ VISITOR_CHECKED_OUT

PASS_MANAGEMENT
├─ PASS_GENERATED
├─ PASS_SCANNED
├─ PASS_REVOKED
└─ PASS_VERIFICATION_FAILED

SECURITY_EVENTS
├─ BLACKLIST_ADDED
├─ BLACKLIST_REMOVED
├─ UNAUTHORIZED_ACCESS_ATTEMPT
├─ SUSPICIOUS_ACTIVITY
└─ EMERGENCY_ALERT

SYSTEM_EVENTS
├─ USER_CREATED
├─ USER_UPDATED
├─ USER_DELETED
├─ ROLE_CHANGED
├─ SETTINGS_CHANGED
└─ BACKUP_CREATED
```

### Audit Log Format

```json
{
  "audit_id": "audit-uuid",
  "timestamp": "2024-12-04T10:30:45.123Z",
  "user_id": "u3333333-3333-3333-3333-333333333333",
  "user_email": "khalid.noon@grandcity.com.pk",
  "user_role": "executive",
  "action": "WALKIN_APPROVED",
  "entity_type": "visits",
  "entity_id": "visit123-uuid",
  "changes": {
    "approval_status": {
      "old": "pending",
      "new": "approved"
    }
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "request_id": "req-abc123",
  "session_id": "sess-xyz789",
  "metadata": {
    "visitor_name": "Sara Ahmed",
    "company": "XYZ Enterprises"
  }
}
```

### Log Retention

- **Audit Logs:** 2 years (compliance requirement)
- **Application Logs:** 90 days
- **Access Logs:** 180 days
- **Error Logs:** 1 year

### Log Analysis

- **Real-time Monitoring:** CloudWatch Logs Insights
- **Alerting:** CloudWatch Alarms for security events
- **SIEM Integration:** Export to centralized SIEM (optional)

---

## Security Monitoring & Alerts

### Real-Time Alerts

#### Critical Alerts (Immediate Notification)
1. Multiple failed login attempts (5+ in 5 minutes)
2. Blacklisted visitor scan attempt
3. Unauthorized API access attempt
4. Privilege escalation attempt
5. System configuration changes
6. Database backup failure

#### Warning Alerts (Daily Summary)
1. Unusual activity patterns
2. High API usage
3. Large data exports
4. Off-hours access
5. Multiple concurrent sessions

### Security Metrics Dashboard

```
┌──────────────────────────────────────────┐
│     Security Monitoring Dashboard        │
├──────────────────────────────────────────┤
│                                          │
│  Failed Login Attempts Today: 12         │
│  Blacklist Scan Attempts: 0              │
│  Suspicious Activities: 2                │
│  Active Sessions: 45                     │
│                                          │
│  Last 24 Hours:                          │
│  ├─ API Requests: 12,543                 │
│  ├─ Authentication Events: 234           │
│  ├─ Visitor Check-ins: 89                │
│  └─ Pass Verifications: 156              │
│                                          │
│  Recent Security Events:                 │
│  ├─ 10:45 AM: Failed login (guard2)     │
│  ├─ 09:30 AM: Unusual API pattern        │
│  └─ 08:15 AM: Password changed (staff5)  │
│                                          │
└──────────────────────────────────────────┘
```

---

## API Security

### Rate Limiting

```javascript
// Rate limit configuration (requests per minute)
const rateLimits = {
  authentication: 10,      // Login attempts
  api_read: 100,          // GET requests
  api_write: 50,          // POST/PUT/DELETE
  report_generation: 5,    // Heavy operations
  file_upload: 20         // File uploads
};
```

**Implementation:** Redis-based sliding window

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1735689600
Retry-After: 45 (if exceeded)
```

### API Key Management

For external integrations:
- **Generation:** UUID v4
- **Rotation:** Manual with 30-day warning
- **Scope:** Limited to specific endpoints
- **Revocation:** Instant via admin panel

### Input Validation

All API inputs validated using JSON Schema:

```javascript
const visitSchema = {
  type: 'object',
  required: ['visitor_id', 'executive_id', 'purpose'],
  properties: {
    visitor_id: { type: 'string', format: 'uuid' },
    executive_id: { type: 'string', format: 'uuid' },
    purpose: { type: 'string', minLength: 10, maxLength: 500 },
    scheduled_start_time: { type: 'string', format: 'date-time' }
  }
};
```

### SQL Injection Prevention

- **ORM:** Sequelize for PostgreSQL
- **Parameterized Queries:** Always
- **No Raw SQL:** Except in controlled admin functions

### XSS Prevention

- **Input Sanitization:** DOMPurify on frontend
- **Output Encoding:** Automatic in React
- **CSP Headers:** Content-Security-Policy enabled

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:;
```

---

## Compliance & Governance

### Data Privacy (GDPR-Inspired)

#### Data Subject Rights
1. **Right to Access:** Users can request their data
2. **Right to Rectification:** Users can correct data
3. **Right to Erasure:** Users can request deletion (with exceptions for legal retention)
4. **Right to Portability:** Export data in JSON/CSV

#### Data Minimization
- Collect only necessary information
- Automatic deletion of old visitor photos (after 1 year)
- Anonymous analytics data

### Retention Policies

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Active Visitor Records | Indefinite | N/A |
| Inactive Visitor Records | 2 years | Soft delete |
| Visit Records | 2 years | Archive to cold storage |
| Audit Logs | 2 years | Hard delete |
| User Sessions | 24 hours | Auto-expire |
| Visitor Photos | 1 year | S3 lifecycle policy |
| Pass QR Codes | 30 days post-visit | S3 lifecycle policy |

### Security Certifications (Recommended)

- **ISO 27001:** Information Security Management
- **SOC 2 Type II:** Service Organization Controls
- **Pakistan PECA Compliance:** Electronic Crime Act

---

## Incident Response Plan

### Severity Levels

#### P0 - Critical (Response: Immediate)
- Data breach
- System completely down
- Ransomware attack
- Unauthorized access to executive data

#### P1 - High (Response: 1 hour)
- Service degradation affecting >50% users
- Security vulnerability discovered
- Database performance issues

#### P2 - Medium (Response: 4 hours)
- Feature not working for specific users
- Non-critical bug affecting workflow

#### P3 - Low (Response: 24 hours)
- Minor UI issues
- Documentation errors

### Incident Response Team

1. **Incident Commander:** Ali Bin Nadeem (Technology Consultant)
2. **Technical Lead:** Senior Backend Engineer
3. **Security Lead:** Security Specialist
4. **Communications Lead:** Shahnawaz (Director Operations)
5. **Executive Liaison:** CEO Office

### Response Workflow

```
1. DETECT → Automated monitoring or user report
   ↓
2. TRIAGE → Assess severity (P0-P3)
   ↓
3. NOTIFY → Alert incident response team
   ↓
4. CONTAIN → Isolate affected systems
   ↓
5. INVESTIGATE → Root cause analysis
   ↓
6. REMEDIATE → Fix the issue
   ↓
7. VERIFY → Confirm resolution
   ↓
8. DOCUMENT → Post-incident report
   ↓
9. REVIEW → Lessons learned, update procedures
```

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in AWS Secrets Manager
- [ ] TLS 1.3 configured and tested
- [ ] Database encryption enabled
- [ ] Backup strategy tested
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] Security headers enabled
- [ ] Vulnerability scan completed
- [ ] Penetration testing done
- [ ] Audit logging verified
- [ ] Session management tested
- [ ] Password policies enforced

### Post-Deployment

- [ ] Monitor CloudWatch alarms
- [ ] Review audit logs daily
- [ ] Check failed login attempts
- [ ] Verify backup success
- [ ] Review API usage patterns
- [ ] Check certificate expiry (30 days before)
- [ ] Quarterly security reviews
- [ ] Annual penetration testing

---

**Security Version:** 1.0  
**Last Updated:** December 2024  
**Security Lead:** Ali Bin Nadeem, Technology Consultant  
**Review Cycle:** Quarterly
