# Guest Pass Management System - Complete Architecture & Implementation Guide
## Grand City HQ

**Version:** 1.0  
**Date:** December 4, 2025  
**Prepared for:** Grand City HQ Leadership Team  
**Prepared by:** Ali Bin Nadeem - Technology Consultant

---

## Executive Summary

This document presents a complete, production-ready cloud-based Guest Pass Management System designed to eliminate walk-in disruptions and ensure controlled guest access for Grand City HQ's 8 C-level executives. The system provides real-time visitor validation, comprehensive audit trails, and weekly compliance reports.

### Key Features
- Pre-scheduled visitor appointments with digital pass generation
- Walk-in visitor registration with instant QR code passes
- Multi-level approval workflows for executive visits
- Real-time validation and access control
- Comprehensive audit logging and compliance reporting
- Role-based access control (RBAC) for 5 user types
- Mobile-responsive interface for all stakeholders

---

## Table of Contents

1. System Architecture
2. Technology Stack
3. Database Schema & ERD
4. User Roles & Permissions
5. API Endpoints
6. Visitor Workflows
7. Security Architecture
8. UI/UX Wireframes
9. Implementation Roadmap
10. Deployment Guide
11. Compliance & Reporting

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Web App (React)  │  Mobile App (PWA)  │  QR Scanner (Guards)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (AWS ALB)                       │
│                     SSL/TLS Termination                          │
│                     Rate Limiting & WAF                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER (ECS)                        │
├─────────────────────────────────────────────────────────────────┤
│  Authentication Service  │  Visitor Service  │  Notification    │
│  (JWT + OAuth)           │  (Core Logic)     │  Service         │
├──────────────────────────┼───────────────────┼──────────────────┤
│  Calendar Service        │  QR Generator     │  Reporting       │
│  (Scheduling)            │  Service          │  Service         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL (RDS)        │  Redis Cache      │  S3 Storage      │
│  - Primary Database      │  - Session Store  │  - Document      │
│  - Multi-AZ Deployment   │  - Rate Limiting  │    Storage       │
│                          │  - Real-time data │  - Photo Storage │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  SNS (Notifications)     │  SES (Email)      │  CloudWatch      │
│  SMS & Push Notifications│  Pass Delivery    │  Logging         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Microservices Architecture

**Core Services:**

1. **Authentication Service**
   - JWT token generation and validation
   - OAuth 2.0 for SSO integration
   - Session management with Redis
   - Multi-factor authentication (MFA)

2. **Visitor Management Service**
   - Visitor registration (scheduled + walk-in)
   - Approval workflow engine
   - Pass generation and validation
   - Check-in/check-out processing

3. **Calendar Service**
   - Executive calendar integration
   - Availability management
   - Appointment scheduling
   - Conflict resolution

4. **QR Code Service**
   - Secure QR code generation
   - QR code validation
   - Time-bound access tokens
   - Device fingerprinting

5. **Notification Service**
   - Email notifications (SES)
   - SMS alerts (SNS)
   - Push notifications (FCM)
   - Real-time WebSocket updates

6. **Reporting & Analytics Service**
   - Weekly compliance reports
   - Executive dashboards
   - Audit trail management
   - Data export capabilities

### 1.3 Cloud Infrastructure (AWS)

**Compute:**
- ECS Fargate for containerized services
- Auto-scaling groups (2-10 instances)
- Application Load Balancer with SSL

**Database:**
- RDS PostgreSQL 15.x (Multi-AZ)
- Read replicas for reporting
- Automated backups (7-day retention)

**Caching:**
- ElastiCache Redis (cluster mode)
- Session storage
- Rate limiting counters

**Storage:**
- S3 for documents and photos
- CloudFront CDN for assets
- Lifecycle policies for archival

**Networking:**
- VPC with public/private subnets
- NAT Gateway for outbound traffic
- Security Groups and NACLs
- Route 53 for DNS

**Security:**
- AWS WAF for API protection
- Secrets Manager for credentials
- KMS for encryption keys
- CloudTrail for audit logs

**Monitoring:**
- CloudWatch for metrics and logs
- X-Ray for distributed tracing
- SNS for alerting

---

## 2. Technology Stack

### 2.1 Frontend Stack

**Web Application:**
- **Framework:** React 18.x with TypeScript
- **State Management:** Redux Toolkit + RTK Query
- **UI Library:** Material-UI (MUI) v5 or Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod validation
- **Calendar:** FullCalendar.js
- **QR Scanning:** html5-qrcode
- **Charts:** Recharts or Chart.js
- **Real-time:** Socket.io-client
- **Build Tool:** Vite

**Mobile PWA:**
- Same React codebase
- Service Workers for offline capability
- Push API for notifications
- Camera API for QR scanning

### 2.2 Backend Stack

**API Layer:**
- **Runtime:** Node.js 20.x (LTS)
- **Framework:** Express.js or Fastify
- **Language:** TypeScript
- **ORM:** Prisma or TypeORM
- **Validation:** Zod or Joi
- **Authentication:** Passport.js + JWT
- **WebSockets:** Socket.io
- **Job Queue:** Bull (Redis-based)
- **PDF Generation:** PDFKit or Puppeteer

**Alternative Backend (Python):**
- **Framework:** FastAPI
- **ORM:** SQLAlchemy 2.0
- **Validation:** Pydantic
- **Background Jobs:** Celery + Redis

### 2.3 Database

**Primary Database:**
- PostgreSQL 15.x
- Extensions: uuid-ossp, pgcrypto, pg_trgm

**Schema Features:**
- Row-level security
- Materialized views for reports
- Full-text search
- JSON columns for flexible data

### 2.4 DevOps & Infrastructure

**Containerization:**
- Docker with multi-stage builds
- Docker Compose for local development

**CI/CD:**
- GitHub Actions or GitLab CI
- Automated testing (Jest, Cypress)
- Code quality (ESLint, Prettier, SonarQube)
- Security scanning (Snyk, Trivy)

**Infrastructure as Code:**
- Terraform or AWS CDK
- Environment management (dev, staging, prod)

**Monitoring:**
- Application: CloudWatch, Datadog, or New Relic
- Error Tracking: Sentry
- Uptime: UptimeRobot or Pingdom

---

## 3. Database Schema & ERD

### 3.1 Core Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    executive_id UUID REFERENCES executives(id),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE TYPE user_role AS ENUM (
    'executive',
    'staff',
    'guard',
    'receptionist',
    'admin'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### executives
```sql
CREATE TABLE executives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE,
    title VARCHAR(100) NOT NULL,
    position executive_position NOT NULL,
    office_location VARCHAR(100),
    approval_required BOOLEAN DEFAULT true,
    auto_approve_staff BOOLEAN DEFAULT false,
    max_visitors_per_day INTEGER DEFAULT 20,
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE executive_position AS ENUM (
    'md_partner',
    'chairman_partner',
    'ceo',
    'director_operations',
    'director_faisalabad',
    'cfo',
    'consultant',
    'tech_consultant'
);
```

#### visitors
```sql
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    cnic VARCHAR(15),
    company VARCHAR(255),
    designation VARCHAR(100),
    photo_url VARCHAR(500),
    vehicle_number VARCHAR(20),
    permanent_visitor BOOLEAN DEFAULT false,
    blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    visit_count INTEGER DEFAULT 0,
    last_visit_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visitors_phone ON visitors(phone);
CREATE INDEX idx_visitors_cnic ON visitors(cnic);
CREATE INDEX idx_visitors_email ON visitors(email);
CREATE INDEX idx_visitors_blacklisted ON visitors(blacklisted) WHERE blacklisted = true;
```

#### visits
```sql
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_code VARCHAR(20) UNIQUE NOT NULL,
    visitor_id UUID REFERENCES visitors(id) NOT NULL,
    executive_id UUID REFERENCES executives(id) NOT NULL,
    host_staff_id UUID REFERENCES users(id),
    visit_type visit_type NOT NULL,
    visit_status visit_status DEFAULT 'scheduled',
    purpose_of_visit TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time_from TIME NOT NULL,
    scheduled_time_to TIME NOT NULL,
    actual_checkin_time TIMESTAMP,
    actual_checkout_time TIMESTAMP,
    checkin_by UUID REFERENCES users(id),
    checkout_by UUID REFERENCES users(id),
    entry_gate VARCHAR(50),
    exit_gate VARCHAR(50),
    accompanying_persons INTEGER DEFAULT 0,
    special_instructions TEXT,
    items_carried TEXT,
    approval_status approval_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    qr_code VARCHAR(500),
    pass_generated_at TIMESTAMP,
    pass_expires_at TIMESTAMP,
    temperature_reading DECIMAL(4,1),
    security_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE TYPE visit_type AS ENUM ('scheduled', 'walk_in', 'recurring');
CREATE TYPE visit_status AS ENUM (
    'scheduled',
    'approved',
    'checked_in',
    'checked_out',
    'cancelled',
    'no_show',
    'rejected'
);
CREATE TYPE approval_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'auto_approved'
);

CREATE INDEX idx_visits_visitor ON visits(visitor_id);
CREATE INDEX idx_visits_executive ON visits(executive_id);
CREATE INDEX idx_visits_scheduled_date ON visits(scheduled_date);
CREATE INDEX idx_visits_status ON visits(visit_status);
CREATE INDEX idx_visits_approval ON visits(approval_status);
CREATE INDEX idx_visits_code ON visits(visit_code);
```

#### visit_approvals
```sql
CREATE TABLE visit_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID REFERENCES visits(id) NOT NULL,
    approver_id UUID REFERENCES users(id) NOT NULL,
    approval_level INTEGER NOT NULL,
    status approval_status NOT NULL,
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visit_approvals_visit ON visit_approvals(visit_id);
CREATE INDEX idx_visit_approvals_approver ON visit_approvals(approver_id);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action audit_action NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'approve',
    'reject',
    'checkin',
    'checkout',
    'login',
    'logout'
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

#### notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES users(id) NOT NULL,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    channels notification_channel[] DEFAULT ARRAY['in_app'],
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE notification_type AS ENUM (
    'visit_request',
    'visit_approved',
    'visit_rejected',
    'visitor_arrived',
    'visitor_waiting',
    'visit_reminder',
    'system_alert'
);

CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = false;
```

#### recurring_visits
```sql
CREATE TABLE recurring_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES visitors(id) NOT NULL,
    executive_id UUID REFERENCES executives(id) NOT NULL,
    host_staff_id UUID REFERENCES users(id),
    purpose TEXT NOT NULL,
    recurrence_pattern JSONB NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    time_from TIME NOT NULL,
    time_to TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- recurrence_pattern example:
-- {"type": "weekly", "days": ["monday", "wednesday"], "frequency": 1}
```

#### weekly_reports
```sql
CREATE TABLE weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_week DATE NOT NULL,
    executive_id UUID REFERENCES executives(id),
    total_visits INTEGER NOT NULL,
    scheduled_visits INTEGER NOT NULL,
    walk_in_visits INTEGER NOT NULL,
    approved_visits INTEGER NOT NULL,
    rejected_visits INTEGER NOT NULL,
    no_shows INTEGER NOT NULL,
    average_wait_time INTERVAL,
    compliance_score DECIMAL(5,2),
    report_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_weekly_reports_week ON weekly_reports(report_week);
CREATE INDEX idx_weekly_reports_executive ON weekly_reports(executive_id);
```

### 3.2 Entity Relationship Diagram

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   users     │──────────│  executives  │──────────│   visits    │
│             │ 1      1 │              │ 1      ∞ │             │
│ - id        │          │ - id         │          │ - id        │
│ - email     │          │ - user_id    │          │ - visit_code│
│ - role      │          │ - position   │          │ - visitor_id│
│ - full_name │          │ - title      │          │ - exec_id   │
└─────────────┘          └──────────────┘          └─────────────┘
       │                                                   │
       │ 1                                                 │ ∞
       │                                                   │
       │                                                   │ 1
       │                                            ┌─────────────┐
       │                                            │  visitors   │
       │                                            │             │
       │                                            │ - id        │
       │                                            │ - full_name │
       │                                            │ - phone     │
       │                                            │ - company   │
       └────────────────────────────────────────────└─────────────┘
                                                            │
                                                            │ 1
                                                            │
                                                            │ ∞
                                                    ┌─────────────┐
                                                    │audit_logs   │
                                                    │             │
                                                    │ - id        │
                                                    │ - action    │
                                                    │ - entity_id │
                                                    └─────────────┘
```

---

## 4. User Roles & Permissions

### 4.1 Role Definitions

#### 1. Executive
**Users:** 8 C-level executives
**Access Level:** Full visibility to their own schedule and visitors

**Permissions:**
- ✅ View their scheduled visits
- ✅ Approve/reject visit requests
- ✅ View visitor history and details
- ✅ Access personal weekly reports
- ✅ Configure availability and preferences
- ✅ Add/edit trusted visitors list
- ❌ Cannot view other executives' schedules (privacy)
- ❌ Cannot perform check-in/check-out

**Dashboard Features:**
- Today's appointments
- Pending approval requests
- Visitor waiting notifications
- Weekly visit summary

#### 2. Staff (Executive Assistants / Team Members)
**Access Level:** Can schedule on behalf of assigned executive(s)

**Permissions:**
- ✅ Schedule visits for assigned executive(s)
- ✅ View assigned executive's calendar
- ✅ Submit visit requests for approval
- ✅ View visitor details and history
- ✅ Receive notifications for their scheduled visits
- ✅ Communicate with security/reception
- ❌ Cannot approve visits
- ❌ Cannot perform check-in/check-out
- ❌ Cannot access other executives' data

**Dashboard Features:**
- Schedule visitor appointments
- Manage executive's calendar
- Track pending approvals
- Visitor contact management

#### 3. Guard / Security Personnel
**Access Level:** Operational - Entry/Exit control

**Permissions:**
- ✅ Register walk-in visitors
- ✅ Scan and validate QR codes
- ✅ Check-in visitors
- ✅ Check-out visitors
- ✅ Record temperature and security notes
- ✅ View today's expected visitors list
- ✅ Access visitor photos and documents
- ✅ Flag security concerns
- ❌ Cannot schedule visits
- ❌ Cannot approve visits
- ❌ Cannot access historical reports

**Dashboard Features:**
- QR code scanner interface
- Today's expected visitors
- Walk-in registration form
- Quick check-in/check-out
- Security alerts

#### 4. Receptionist / Office Boy / PSO
**Access Level:** Operational - Visitor assistance

**Permissions:**
- ✅ Register walk-in visitors
- ✅ View today's appointments
- ✅ Notify executives of visitor arrival
- ✅ Print visitor passes
- ✅ Update visitor status
- ✅ Access visitor contact information
- ❌ Cannot approve visits
- ❌ Cannot check-in/check-out (security only)
- ❌ Cannot access sensitive executive data

**Dashboard Features:**
- Today's visitor list
- Walk-in registration
- Visitor notification system
- Waiting room management

#### 5. Admin / System Administrator
**Access Level:** Full system access

**Permissions:**
- ✅ Full system configuration
- ✅ User management (create, edit, deactivate)
- ✅ Executive profile management
- ✅ View all visits and schedules
- ✅ Access all reports and analytics
- ✅ Audit log access
- ✅ System settings and integrations
- ✅ Blacklist management
- ✅ Override approvals (emergency)

**Dashboard Features:**
- System-wide analytics
- User management
- Compliance reports
- Security oversight
- Configuration panel

### 4.2 Permission Matrix

| Feature | Executive | Staff | Guard | Reception | Admin |
|---------|-----------|-------|-------|-----------|-------|
| Schedule Visit | Own only | Assigned exec | ❌ | ❌ | ✅ |
| Approve Visit | Own only | ❌ | ❌ | ❌ | ✅ |
| Check-in Visitor | ❌ | ❌ | ✅ | ❌ | ✅ |
| Register Walk-in | ❌ | ❌ | ✅ | ✅ | ✅ |
| View All Schedules | Own only | Assigned | Today only | Today only | ✅ |
| Generate Reports | Own only | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit Log Access | ❌ | ❌ | ❌ | ❌ | ✅ |
| Blacklist Visitor | ❌ | ❌ | Flag only | Flag only | ✅ |
| System Config | ❌ | ❌ | ❌ | ❌ | ✅ |

### 4.3 Data Isolation Rules

**Executive Privacy:**
- Executives can only see their own scheduled visits
- Cross-executive scheduling requires explicit permission
- Executive calendars are private by default
- Only admin can view system-wide executive data

**Staff Boundaries:**
- Staff members are assigned to specific executives
- Cannot view or schedule for unassigned executives
- Assignment managed by admin

**Operational Roles:**
- Guards and receptionists only see current day data
- Historical access limited to 7 days
- No access to executive personal information

**Audit Trail:**
- All actions logged with user, timestamp, IP
- Immutable audit log (append-only)
- Retention: 2 years minimum

---

## 5. API Endpoints

### 5.1 Authentication Endpoints

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
POST   /api/v1/auth/change-password
POST   /api/v1/auth/mfa/enable
POST   /api/v1/auth/mfa/verify
```

**Example: Login**
```json
POST /api/v1/auth/login
{
  "email": "khalid.noon@grandcity.pk",
  "password": "SecurePass123!",
  "mfaCode": "123456"
}

Response 200:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "khalid.noon@grandcity.pk",
      "fullName": "Khalid Noon",
      "role": "executive",
      "executive": {
        "id": "uuid",
        "position": "ceo",
        "title": "CEO"
      }
    },
    "expiresIn": 3600
  }
}
```

### 5.2 Visitor Management Endpoints

```
GET    /api/v1/visitors
POST   /api/v1/visitors
GET    /api/v1/visitors/:id
PUT    /api/v1/visitors/:id
DELETE /api/v1/visitors/:id
GET    /api/v1/visitors/search?q=:query
GET    /api/v1/visitors/:id/history
POST   /api/v1/visitors/:id/blacklist
DELETE /api/v1/visitors/:id/blacklist
POST   /api/v1/visitors/:id/photo
```

**Example: Create Visitor**
```json
POST /api/v1/visitors
{
  "fullName": "Ahmed Hassan",
  "email": "ahmed@example.com",
  "phone": "+92-300-1234567",
  "cnic": "12345-6789012-3",
  "company": "Tech Solutions Pvt Ltd",
  "designation": "Project Manager"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "fullName": "Ahmed Hassan",
    "email": "ahmed@example.com",
    "phone": "+92-300-1234567",
    "cnic": "12345-6789012-3",
    "company": "Tech Solutions Pvt Ltd",
    "designation": "Project Manager",
    "visitCount": 0,
    "createdAt": "2025-12-04T10:30:00Z"
  }
}
```

### 5.3 Visit Management Endpoints

```
GET    /api/v1/visits
POST   /api/v1/visits
GET    /api/v1/visits/:id
PUT    /api/v1/visits/:id
DELETE /api/v1/visits/:id
GET    /api/v1/visits/:id/pass
POST   /api/v1/visits/:id/approve
POST   /api/v1/visits/:id/reject
POST   /api/v1/visits/:id/checkin
POST   /api/v1/visits/:id/checkout
POST   /api/v1/visits/walk-in
GET    /api/v1/visits/today
GET    /api/v1/visits/pending-approval
```

**Example: Schedule Visit**
```json
POST /api/v1/visits
{
  "visitorId": "uuid",
  "executiveId": "uuid",
  "visitType": "scheduled",
  "purposeOfVisit": "Quarterly business review meeting",
  "scheduledDate": "2025-12-10",
  "scheduledTimeFrom": "14:00",
  "scheduledTimeTo": "15:30",
  "specialInstructions": "Please arrange conference room",
  "accompaniyingPersons": 2
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "visitCode": "GC-2025-001234",
    "visitorId": "uuid",
    "executiveId": "uuid",
    "visitType": "scheduled",
    "visitStatus": "scheduled",
    "approvalStatus": "pending",
    "purposeOfVisit": "Quarterly business review meeting",
    "scheduledDate": "2025-12-10",
    "scheduledTimeFrom": "14:00",
    "scheduledTimeTo": "15:30",
    "passExpiresAt": "2025-12-10T15:30:00Z",
    "createdAt": "2025-12-04T11:00:00Z"
  },
  "message": "Visit scheduled successfully. Pending executive approval."
}
```

**Example: Walk-in Registration**
```json
POST /api/v1/visits/walk-in
{
  "visitor": {
    "fullName": "Sara Khan",
    "phone": "+92-321-9876543",
    "cnic": "54321-0987654-2",
    "company": "Consulting Associates"
  },
  "executiveId": "uuid",
  "purposeOfVisit": "Document submission",
  "itemsCarried": "1 laptop bag, documents folder"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "visitCode": "GC-2025-WI-001",
    "visitStatus": "approved",
    "approvalStatus": "auto_approved",
    "qrCode": "data:image/png;base64,iVBORw0KG...",
    "passGeneratedAt": "2025-12-04T11:05:00Z"
  },
  "message": "Walk-in visitor registered successfully."
}
```

**Example: Check-in Visitor**
```json
POST /api/v1/visits/:id/checkin
{
  "entryGate": "Main Gate",
  "temperatureReading": 36.7,
  "securityNotes": "Verified CNIC"
}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "visitStatus": "checked_in",
    "actualCheckinTime": "2025-12-04T14:03:00Z",
    "checkinBy": "uuid",
    "entryGate": "Main Gate"
  }
}
```

### 5.4 Calendar & Scheduling Endpoints

```
GET    /api/v1/calendar/availability
GET    /api/v1/calendar/:executiveId/slots
POST   /api/v1/calendar/block-time
GET    /api/v1/calendar/conflicts
```

### 5.5 QR Code Endpoints

```
GET    /api/v1/qr/generate/:visitId
POST   /api/v1/qr/validate
GET    /api/v1/qr/scan/:code
```

**Example: Validate QR Code**
```json
POST /api/v1/qr/validate
{
  "qrCode": "GC-2025-001234-abc123def456",
  "scannedAt": "2025-12-10T14:02:00Z",
  "location": "Main Gate"
}

Response 200:
{
  "success": true,
  "valid": true,
  "data": {
    "visit": {
      "visitCode": "GC-2025-001234",
      "visitor": {
        "fullName": "Ahmed Hassan",
        "company": "Tech Solutions",
        "photo": "https://..."
      },
      "executive": {
        "fullName": "Khalid Noon",
        "title": "CEO"
      },
      "purpose": "Quarterly business review",
      "validUntil": "2025-12-10T15:30:00Z"
    },
    "canCheckIn": true
  }
}
```

### 5.6 Reporting Endpoints

```
GET    /api/v1/reports/weekly
GET    /api/v1/reports/weekly/:executiveId
GET    /api/v1/reports/daily
GET    /api/v1/reports/compliance
GET    /api/v1/reports/visitor-analytics
POST   /api/v1/reports/export
```

**Example: Weekly Report**
```json
GET /api/v1/reports/weekly?executiveId=uuid&weekOf=2025-12-02

Response 200:
{
  "success": true,
  "data": {
    "weekOf": "2025-12-02",
    "executive": {
      "id": "uuid",
      "fullName": "Khalid Noon",
      "position": "CEO"
    },
    "summary": {
      "totalVisits": 34,
      "scheduledVisits": 28,
      "walkInVisits": 6,
      "approvedVisits": 32,
      "rejectedVisits": 2,
      "noShows": 3,
      "averageWaitTime": "8 minutes",
      "complianceScore": 94.5
    },
    "dailyBreakdown": [
      {
        "date": "2025-12-02",
        "visits": 7,
        "scheduled": 6,
        "walkIn": 1
      }
    ],
    "topVisitors": [
      {
        "name": "Ahmed Hassan",
        "company": "Tech Solutions",
        "visits": 3
      }
    ],
    "visitsByPurpose": {
      "business_meeting": 18,
      "document_submission": 8,
      "interview": 5,
      "other": 3
    }
  }
}
```

### 5.7 Notification Endpoints

```
GET    /api/v1/notifications
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/read-all
GET    /api/v1/notifications/unread-count
POST   /api/v1/notifications/preferences
```

### 5.8 Admin Endpoints

```
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PUT    /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id
GET    /api/v1/admin/audit-logs
GET    /api/v1/admin/system-stats
POST   /api/v1/admin/backup
```

### 5.9 WebSocket Events

```
Connection: wss://api.grandcity.pk/ws

Events:
- visitor:arrival
- visit:approved
- visit:rejected
- visit:checkin
- visit:checkout
- notification:new
- system:alert
```

---

## 6. Visitor Workflows

### 6.1 Scheduled Visit Workflow

```
┌─────────────────────────────────────────────────────────────┐
│               SCHEDULED VISIT WORKFLOW                       │
└─────────────────────────────────────────────────────────────┘

Step 1: SCHEDULING (Staff Member)
├─ Staff logs into system
├─ Searches for existing visitor or creates new
├─ Selects executive from their assigned list
├─ Chooses date/time from available slots
├─ Enters purpose and special instructions
└─ Submits visit request
      │
      ▼
Step 2: APPROVAL (Executive or Auto-approval)
├─ Executive receives notification
├─ Reviews visitor details and purpose
├─ Decision:
│   ├─ APPROVE → Continue to Step 3
│   └─ REJECT → Workflow ends, notification sent
      │
      ▼
Step 3: PASS GENERATION (System)
├─ System generates unique visit code
├─ Creates QR code with encrypted data
├─ Sends email/SMS to visitor with:
│   ├─ Digital pass (PDF)
│   ├─ QR code
│   ├─ Visit details
│   └─ Directions
└─ Sends confirmation to staff & executive
      │
      ▼
Step 4: VISITOR ARRIVAL (Day of Visit)
├─ Visitor arrives at gate
├─ Shows QR code (digital or printed)
└─ Guard scans QR code
      │
      ▼
Step 5: VALIDATION (Guard)
├─ System validates QR code
├─ Checks:
│   ├─ Pass not expired
│   ├─ Visitor not blacklisted
│   ├─ Visit scheduled for today
│   └─ Time window valid
├─ Guard verifies:
│   ├─ Photo ID matches
│   ├─ Takes temperature
│   └─ Inspects items carried
└─ Decision:
    ├─ VALID → Continue to Step 6
    └─ INVALID → Access denied, alert admin
      │
      ▼
Step 6: CHECK-IN (Guard)
├─ Guard performs check-in
├─ System records:
│   ├─ Actual check-in time
│   ├─ Entry gate
│   ├─ Temperature
│   └─ Security notes
├─ Prints physical pass (if needed)
└─ Notifications sent:
    ├─ Executive: "Your visitor has arrived"
    ├─ Staff: "Visitor checked in"
    └─ Reception: "Visitor en route"
      │
      ▼
Step 7: MEETING (Visitor with Executive)
├─ Visitor proceeds to executive's office
├─ Reception/PSO guides if needed
└─ Meeting takes place
      │
      ▼
Step 8: CHECK-OUT (Guard)
├─ Visitor returns to gate
├─ Guard scans QR code or searches by name
├─ System records:
│   ├─ Actual check-out time
│   ├─ Exit gate
│   └─ Duration of visit
└─ Visit marked as completed
      │
      ▼
Step 9: POST-VISIT (System)
├─ Update visitor statistics
├─ Archive visit in history
├─ Generate audit log entry
└─ Include in weekly report
```

### 6.2 Walk-in Visit Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                 WALK-IN VISIT WORKFLOW                       │
└─────────────────────────────────────────────────────────────┘

Step 1: ARRIVAL (Visitor)
├─ Visitor arrives unannounced
└─ Approaches guard/reception
      │
      ▼
Step 2: REGISTRATION (Guard/Reception)
├─ Guard/Reception opens walk-in form
├─ Collects information:
│   ├─ Full name, phone, CNIC
│   ├─ Company and designation
│   ├─ Purpose of visit
│   ├─ Whom to meet (executive)
│   └─ Items being carried
├─ Searches for existing visitor profile
│   ├─ Found → Use existing
│   └─ Not found → Create new
├─ Checks blacklist status
│   ├─ Blacklisted → Deny entry, alert admin
│   └─ Clear → Continue
└─ Takes visitor photo (optional)
      │
      ▼
Step 3: EXECUTIVE NOTIFICATION (System)
├─ System notifies executive via:
│   ├─ In-app notification
│   ├─ SMS (if urgent)
│   └─ Call (if very urgent)
├─ Notification includes:
│   ├─ Visitor name and company
│   ├─ Purpose of visit
│   └─ Quick approve/reject buttons
      │
      ▼
Step 4: EXECUTIVE RESPONSE
├─ Executive reviews notification
├─ Decision:
│   ├─ APPROVE NOW → Continue to Step 5
│   ├─ SCHEDULE FOR LATER → Create appointment
│   └─ REJECT → Workflow ends, visitor informed
      │
      ▼
Step 5: INSTANT PASS GENERATION (System)
├─ System auto-approves (if configured)
├─ Or awaits executive's approval
├─ Generates:
│   ├─ Unique visit code
│   ├─ QR code
│   └─ Digital pass
├─ Pass valid for:
│   ├─ Rest of business day, OR
│   └─ Specific time window
      │
      ▼
Step 6: CHECK-IN (Guard)
├─ Same as scheduled visit Step 6
├─ Additional security check for walk-ins
├─ Record temperature and items
└─ Issue physical pass/sticker
      │
      ▼
Step 7-9: MEETING & CHECK-OUT
└─ Same as scheduled visit Steps 7-9
```

### 6.3 Recurring Visit Workflow

```
┌─────────────────────────────────────────────────────────────┐
│               RECURRING VISIT WORKFLOW                       │
│           (For regular contractors, consultants)             │
└─────────────────────────────────────────────────────────────┘

Step 1: SETUP (Staff/Admin)
├─ Create visitor as "Permanent Visitor"
├─ Define recurrence pattern:
│   ├─ Daily, Weekly, Monthly
│   ├─ Specific days (e.g., Mon, Wed, Fri)
│   └─ Time window
├─ Set start and end date
└─ Executive pre-approves pattern
      │
      ▼
Step 2: AUTO-GENERATION (System - Daily Job)
├─ System runs at 12:00 AM daily
├─ Creates visit entries for:
│   ├─ Today's recurring visits
│   └─ Generates QR codes
├─ Sends notification to visitors
└─ Marks as "auto_approved"
      │
      ▼
Step 3-9: REGULAR FLOW
└─ Follows scheduled visit workflow (Steps 4-9)
```

### 6.4 Emergency/VIP Fast-Track

```
Step 1: VIP Arrival
├─ Guard recognizes VIP or emergency
├─ Calls duty officer/admin
└─ Selects "VIP Fast-Track" option
      │
      ▼
Step 2: Instant Access
├─ Admin remotely approves via mobile
├─ System generates instant pass
├─ Guard checks in immediately
└─ Post-event audit review
```

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

**Multi-layered Security:**

1. **Authentication Layer**
   ```
   ┌─────────────────────────────────────────┐
   │     Authentication Flow                  │
   ├─────────────────────────────────────────┤
   │  1. Email/Password (Bcrypt hash)        │
   │  2. MFA (TOTP - 6 digit code)           │
   │  3. Device Recognition                   │
   │  4. JWT Token Issuance                   │
   │  5. Refresh Token (Redis stored)        │
   └─────────────────────────────────────────┘
   ```

   - **Password Policy:**
     - Minimum 12 characters
     - Must include: uppercase, lowercase, number, special char
     - No common passwords (dictionary check)
     - Cannot reuse last 5 passwords
     - Expires every 90 days for admins

   - **Multi-Factor Authentication:**
     - TOTP (Google Authenticator compatible)
     - Backup codes provided
     - Required for: Executives, Admins
     - Optional for: Staff, Guards, Reception

   - **JWT Tokens:**
     - Access Token: 1 hour expiry
     - Refresh Token: 7 days expiry
     - Signed with RS256 algorithm
     - Includes claims: user_id, role, permissions

2. **Authorization Layer (RBAC)**
   ```typescript
   // Permission check middleware
   interface Permission {
     resource: string;
     action: 'create' | 'read' | 'update' | 'delete';
     scope: 'own' | 'team' | 'all';
   }

   // Example: Staff scheduling visit
   {
     resource: 'visit',
     action: 'create',
     scope: 'team' // Only for assigned executives
   }
   ```

3. **Data Isolation**
   - Row-Level Security (RLS) in PostgreSQL
   - Executives can only query their own data
   - Staff filtered by assigned executive_id
   - Guards see only today's data

### 7.2 QR Code Security

**QR Code Structure:**
```
GC-{YEAR}-{SEQUENCE}-{ENCRYPTED_PAYLOAD}

Example: GC-2025-001234-e4f9a2b8c3d7f1a5

Encrypted Payload Contains:
- visit_id (UUID)
- visitor_id (UUID)
- executive_id (UUID)
- timestamp (Unix time)
- expiry_timestamp
- signature (HMAC-SHA256)
```

**Security Measures:**
1. **Time-bound:** QR codes expire after visit window
2. **Single-use:** Marked as used after check-in (prevented replay attacks)
3. **Encrypted:** AES-256 encryption
4. **Signed:** HMAC-SHA256 to prevent tampering
5. **Rate-limited:** Max 3 scan attempts per minute per device

**Validation Process:**
```typescript
async function validateQRCode(qrCode: string): Promise<ValidationResult> {
  // 1. Parse QR code
  const [prefix, year, sequence, payload] = qrCode.split('-');
  
  // 2. Decrypt payload
  const decrypted = decrypt(payload, SECRET_KEY);
  
  // 3. Verify signature
  if (!verifySignature(decrypted, signature)) {
    return { valid: false, reason: 'Invalid signature' };
  }
  
  // 4. Check expiry
  if (Date.now() > decrypted.expiryTimestamp) {
    return { valid: false, reason: 'QR code expired' };
  }
  
  // 5. Check if already used
  const visit = await getVisit(decrypted.visitId);
  if (visit.status === 'checked_in') {
    return { valid: false, reason: 'Already checked in' };
  }
  
  // 6. Check blacklist
  const visitor = await getVisitor(decrypted.visitorId);
  if (visitor.blacklisted) {
    return { valid: false, reason: 'Visitor blacklisted' };
  }
  
  return { valid: true, visit, visitor };
}
```

### 7.3 Data Encryption

**At Rest:**
- Database: AWS RDS encryption (AES-256)
- Files: S3 server-side encryption (SSE-KMS)
- Backups: Encrypted before upload

**In Transit:**
- TLS 1.3 for all API communication
- Certificate pinning for mobile apps
- HTTPS enforced (HSTS header)

**Sensitive Fields:**
- CNIC numbers: Encrypted at application level
- Phone numbers: Partially masked in logs
- Photos: Access-controlled URLs with expiry

### 7.4 Audit Trail

**What is Logged:**
- All CRUD operations on visits and visitors
- All approval/rejection actions
- All check-in/check-out events
- All authentication attempts (success & failure)
- All admin actions
- All blacklist modifications

**Audit Log Structure:**
```json
{
  "id": "uuid",
  "timestamp": "2025-12-04T10:30:00Z",
  "userId": "uuid",
  "userRole": "guard",
  "action": "checkin",
  "entityType": "visit",
  "entityId": "uuid",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "changes": {
    "before": {"status": "approved"},
    "after": {"status": "checked_in", "actualCheckinTime": "2025-12-04T10:30:00Z"}
  },
  "metadata": {
    "location": "Main Gate",
    "device": "Scanner-01"
  }
}
```

**Audit Log Guarantees:**
- Immutable (append-only table)
- Cannot be deleted by any user
- Retained for minimum 2 years
- Exported to cold storage annually

### 7.5 API Security

**Rate Limiting:**
```
Public endpoints: 60 requests/minute
Authenticated: 300 requests/minute
Admin: 1000 requests/minute
QR validation: 10 requests/minute (per device)
```

**Input Validation:**
- All inputs validated against schema (Zod/Joi)
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- CSRF protection (tokens for state-changing operations)

**API Security Headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

**CORS Configuration:**
```javascript
{
  origin: [
    'https://guests.grandcity.pk',
    'https://admin.grandcity.pk'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### 7.6 Incident Response

**Security Monitoring:**
- Failed login attempts (>5 = lock account)
- Unusual access patterns (ML-based anomaly detection)
- Multiple blacklisted visitor access attempts
- QR code tampering attempts
- Admin actions outside business hours

**Automated Responses:**
- Account lockout after 5 failed logins
- IP blacklisting after 20 failed requests
- Alert admin on critical security events
- Automatic logout after 30 min inactivity

**Incident Escalation:**
```
Level 1: Log event
Level 2: Notify security team
Level 3: Notify admin + lock resource
Level 4: System-wide alert + CEO notification
```

---

## 8. UI/UX Wireframes

### 8.1 Executive Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Grand City HQ - Guest Pass System            [Khalid Noon] [⚙]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TODAY'S SCHEDULE                           Wednesday, Dec 4    │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ 10:00 AM - 11:00 AM                                 │      │
│  │ Ahmed Hassan - Tech Solutions                       │      │
│  │ Purpose: Q4 Business Review                         │      │
│  │ Status: [Checked In ✓]                              │      │
│  └──────────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ 02:00 PM - 03:30 PM                                 │      │
│  │ Sara Khan - Consulting Associates                   │      │
│  │ Purpose: Project Proposal                           │      │
│  │ Status: [Scheduled]                    [Details]    │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  PENDING APPROVALS                                   (3 pending)│
│  ┌──────────────────────────────────────────────────────┐      │
│  │ 👤 Muhammad Irfan - ABC Corporation                 │      │
│  │ Walk-in request - Document submission               │      │
│  │ Arrived: 5 minutes ago                              │      │
│  │ [✓ Approve]  [✗ Reject]                    [View]  │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  QUICK STATS                                                     │
│  ┌────────┬────────┬────────┬────────┐                         │
│  │ Today  │ Week   │ Month  │ No-Show│                         │
│  │   4    │   18   │   67   │    2   │                         │
│  └────────┴────────┴────────┴────────┘                         │
│                                                                  │
│  [View Calendar]  [Weekly Report]  [Settings]                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Staff Scheduling Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  Schedule Visitor                                        [Close]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: Visitor Information                                     │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Search Visitor: [Ahmed Has____________] [🔍]        │      │
│  │                                                       │      │
│  │ Select from recent:                                  │      │
│  │ • Ahmed Hassan - Tech Solutions (Last visit: 2 days)│      │
│  │ • Sara Khan - Consulting (Last visit: 1 week)      │      │
│  │                                                       │      │
│  │ Or [+ Create New Visitor]                           │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  STEP 2: Meeting Details                                         │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Executive: [Khalid Noon - CEO          ▼]          │      │
│  │ Date:      [December 10, 2025          📅]          │      │
│  │ Time:      [14:00] to [15:30]                       │      │
│  │ Purpose:   [_____________________________]          │      │
│  │            [_____________________________]          │      │
│  │                                                       │      │
│  │ Special Instructions (optional):                     │      │
│  │ [____________________________________________]       │      │
│  │                                                       │      │
│  │ Accompanying persons: [0]                           │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ☑ Send email confirmation to visitor                          │
│  ☑ Send SMS reminder 1 hour before                             │
│                                                                  │
│  [Cancel]                             [Schedule Visit]          │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Guard QR Scanner Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  QR Code Scanner - Main Gate                    [Menu] [Logout]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────┐            │
│  │                                                 │            │
│  │              📷 CAMERA VIEW                    │            │
│  │                                                 │            │
│  │         [Scan QR Code Here]                    │            │
│  │                                                 │            │
│  │              ┌─────────────┐                   │            │
│  │              │ QR SCANNING │                   │            │
│  │              │    AREA     │                   │            │
│  │              └─────────────┘                   │            │
│  │                                                 │            │
│  └────────────────────────────────────────────────┘            │
│                                                                  │
│  OR                                                              │
│                                                                  │
│  Enter Visit Code: [GC-2025-______]  [Validate]                │
│                                                                  │
│  QUICK ACTIONS:                                                  │
│  [Register Walk-in]  [Today's Visitors]  [Emergency Access]    │
│                                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                                  │
│  RECENT CHECK-INS:                                               │
│  ✓ 10:05 AM - Ahmed Hassan (Tech Solutions)                    │
│  ✓ 09:45 AM - Sara Khan (Consulting)                           │
│  ✓ 09:20 AM - Muhammad Ali (Construction Co)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 QR Validation Result Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  Visitor Validation                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ VALID PASS                                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  [Photo]     AHMED HASSAN                           │      │
│  │              Tech Solutions Pvt Ltd                  │      │
│  │              Project Manager                         │      │
│  │                                                       │      │
│  │  Visit Code:  GC-2025-001234                        │      │
│  │  CNIC:        12345-6789012-3                       │      │
│  │  Phone:       +92-300-1234567                       │      │
│  │                                                       │      │
│  │  Meeting with: Khalid Noon (CEO)                    │      │
│  │  Purpose:     Quarterly Business Review              │      │
│  │  Scheduled:   14:00 - 15:30                         │      │
│  │  Valid Until: 15:30 Today                           │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  CHECK-IN DETAILS:                                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Temperature:    [36.5] °C                           │      │
│  │ Items Carried:  [Laptop, documents folder]          │      │
│  │ Entry Gate:     [Main Gate ▼]                      │      │
│  │ Security Notes: [_____________________________]     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  [✗ Cancel]                      [✓ CHECK IN VISITOR]          │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 Walk-in Registration Form

```
┌─────────────────────────────────────────────────────────────────┐
│  Walk-in Visitor Registration                            [Close]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VISITOR INFORMATION                                             │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Full Name*:     [_____________________________]     │      │
│  │ Phone*:         [+92-___-_______]                   │      │
│  │ CNIC:           [_____-_______-_]                   │      │
│  │ Email:          [_____________________________]     │      │
│  │ Company:        [_____________________________]     │      │
│  │ Designation:    [_____________________________]     │      │
│  │                                                       │      │
│  │ [📷 Take Photo] [Upload Photo]                     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  VISIT DETAILS                                                   │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Meeting with*:  [Select Executive      ▼]          │      │
│  │                 • Khalid Noon - CEO                  │      │
│  │                 • Rehan Gillani - Chairman           │      │
│  │                 • ...                                │      │
│  │                                                       │      │
│  │ Purpose*:       [_____________________________]     │      │
│  │                 [_____________________________]     │      │
│  │                                                       │      │
│  │ Vehicle No:     [___________]                       │      │
│  │ Items Carried:  [_____________________________]     │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  APPROVAL METHOD:                                                │
│  ○ Notify executive for approval (wait time: ~2-5 min)         │
│  ○ Call executive now (urgent)                                  │
│                                                                  │
│  [Cancel]                               [Register & Notify]     │
└─────────────────────────────────────────────────────────────────┘
```

### 8.6 Weekly Compliance Report

```
┌─────────────────────────────────────────────────────────────────┐
│  Weekly Compliance Report                    [Export PDF] [📧] │
│  Week of December 2-8, 2025                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  EXECUTIVE OVERVIEW                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Khalid Noon - CEO                                   │      │
│  │ Total Visits: 34  |  Scheduled: 28  |  Walk-in: 6  │      │
│  │ Approved: 32  |  Rejected: 2  |  No-shows: 3        │      │
│  │ Avg Wait: 8 min  |  Compliance: 94.5%  [View]      │      │
│  └──────────────────────────────────────────────────────┘      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Rehan Gillani - Chairman                            │      │
│  │ Total Visits: 22  |  Scheduled: 20  |  Walk-in: 2  │      │
│  │ Approved: 22  |  Rejected: 0  |  No-shows: 1        │      │
│  │ Avg Wait: 5 min  |  Compliance: 97.8%  [View]      │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  SYSTEM-WIDE METRICS                                             │
│  ┌───────────────┬───────────────┬───────────────┐            │
│  │ Total Visits  │ Approval Rate │ Avg Check-in  │            │
│  │     156       │     96.2%     │   3.5 min     │            │
│  └───────────────┴───────────────┴───────────────┘            │
│                                                                  │
│  DAILY BREAKDOWN                          [📊 View Chart]      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ Mon Dec 2:  28 visits  |  Tue Dec 3:  31 visits     │      │
│  │ Wed Dec 4:  24 visits  |  Thu Dec 5:  29 visits     │      │
│  │ Fri Dec 6:  27 visits  |  Sat Dec 7:  12 visits     │      │
│  │ Sun Dec 8:   5 visits                                │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  SECURITY INCIDENTS                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ • 1 blacklisted visitor attempted entry (denied)    │      │
│  │ • 2 expired passes scanned (walk-ins converted)     │      │
│  │ • 0 security breaches                               │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  [Previous Week]  [View Full Report]  [Next Week]              │
└─────────────────────────────────────────────────────────────────┘
```

### 8.7 Mobile Responsive Views

**Executive Mobile Dashboard:**
```
┌───────────────────┐
│ ☰  Grand City    │
│                   │
│ Today's Visitors  │
│ ─────────────────│
│ ┌───────────────┐│
│ │ 10:00 AM      ││
│ │ Ahmed Hassan  ││
│ │ Tech Solutions││
│ │ [Checked In ✓]││
│ └───────────────┘│
│                   │
│ ┌───────────────┐│
│ │ 02:00 PM      ││
│ │ Sara Khan     ││
│ │ Consulting    ││
│ │ [Scheduled]   ││
│ └───────────────┘│
│                   │
│ Pending (2) 🔴   │
│ [View All]        │
│                   │
│ [Calendar][Stats] │
└───────────────────┘
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Week 1: Infrastructure Setup**
- Set up AWS account and VPC
- Configure RDS PostgreSQL (Multi-AZ)
- Set up ElastiCache Redis cluster
- Configure S3 buckets with policies
- Set up CloudFront CDN
- Configure Route 53 DNS
- Set up development environment
- Initialize Git repository

**Week 2: Core Backend Development**
- Database schema implementation
- Seed data (8 executives, test users)
- Authentication service (JWT, bcrypt)
- User management endpoints
- Basic RBAC middleware
- Audit logging service
- Error handling framework
- API documentation (Swagger)

**Deliverables:**
- ✓ Cloud infrastructure provisioned
- ✓ Database deployed with schema
- ✓ Authentication working
- ✓ API documentation published

### Phase 2: Core Features (Weeks 3-5)

**Week 3: Visitor & Visit Management**
- Visitor CRUD endpoints
- Visit scheduling service
- Calendar integration
- Approval workflow engine
- QR code generation service
- Notification service (email/SMS)
- Visitor search functionality

**Week 4: Check-in/Check-out System**
- QR code validation service
- Check-in endpoint
- Check-out endpoint
- Walk-in registration flow
- Real-time notifications (WebSocket)
- Guard mobile interface APIs
- Blacklist management

**Week 5: Frontend Development - Phase 1**
- React project setup (Vite + TypeScript)
- Authentication UI (login, MFA)
- Executive dashboard
- Staff scheduling interface
- Visitor management screens
- State management (Redux Toolkit)
- API integration layer

**Deliverables:**
- ✓ Complete visitor lifecycle working
- ✓ QR code system functional
- ✓ Basic UI for executives and staff

### Phase 3: Advanced Features (Weeks 6-7)

**Week 6: Guard & Reception Interfaces**
- Guard QR scanner UI (mobile-optimized)
- Walk-in registration form
- Receptionist dashboard
- Today's visitor list view
- Quick check-in/check-out UI
- Security notes interface
- Camera integration for photos

**Week 7: Reporting & Analytics**
- Weekly report generation
- Daily compliance reports
- Executive analytics dashboard
- Visitor statistics
- Export functionality (PDF, Excel)
- Audit log viewer (admin)
- System health monitoring

**Deliverables:**
- ✓ Complete operational UI for all roles
- ✓ Reporting system functional
- ✓ Admin panel complete

### Phase 4: Testing & Refinement (Weeks 8-9)

**Week 8: Testing**
- Unit tests (Jest) - 80% coverage
- Integration tests (Supertest)
- E2E tests (Cypress)
- Security testing (OWASP Top 10)
- Performance testing (k6)
- Load testing (JMeter)
- Penetration testing
- UAT with selected users

**Week 9: Refinement & Training**
- Bug fixes from testing
- Performance optimization
- UI/UX improvements
- Mobile responsiveness polish
- User documentation
- Training materials (videos)
- Admin manual
- Staff training sessions

**Deliverables:**
- ✓ All critical bugs resolved
- ✓ System tested and hardened
- ✓ Documentation complete
- ✓ Users trained

### Phase 5: Deployment & Launch (Week 10)

**Week 10: Production Deployment**
- Production environment setup
- Data migration (if any)
- DNS configuration
- SSL certificate installation
- Monitoring setup (CloudWatch)
- Backup configuration
- Disaster recovery test
- Soft launch (1 executive)
- Full launch (all executives)
- Post-launch monitoring

**Deliverables:**
- ✓ System live in production
- ✓ All executives onboarded
- ✓ Monitoring active
- ✓ Support team ready

### Phase 6: Post-Launch Support (Weeks 11-12)

**Weeks 11-12: Stabilization**
- 24/7 monitoring
- Incident response
- User feedback collection
- Minor enhancements
- Performance tuning
- Weekly status reports
- Knowledge transfer
- Handoff to support team

---

## 10. Deployment Guide

### 10.1 AWS Infrastructure Setup

**Prerequisites:**
- AWS Account with admin access
- AWS CLI configured
- Terraform installed (optional but recommended)

**Infrastructure Components:**

```hcl
# Terraform configuration example
# main.tf

provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "grand-city-guest-pass-vpc"
  }
}

# Public Subnets (for ALB)
resource "aws_subnet" "public_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
}

# Private Subnets (for ECS, RDS)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "us-east-1a"
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = "us-east-1b"
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier             = "guest-pass-db"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  storage_encrypted      = true
  multi_az               = true
  db_name                = "guestpass"
  username               = "admin"
  password               = var.db_password
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = false
  final_snapshot_identifier = "guest-pass-final-snapshot"
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "guest-pass-cache"
  engine               = "redis"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.cache.id]
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "guest-pass-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "guest-pass-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

# S3 Bucket for visitor photos
resource "aws_s3_bucket" "photos" {
  bucket = "grand-city-visitor-photos"
}

resource "aws_s3_bucket_versioning" "photos" {
  bucket = aws_s3_bucket.photos.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "photos" {
  bucket = aws_s3_bucket.photos.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

### 10.2 Docker Configuration

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose (Local Development):**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: guestpass
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
  
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/guestpass
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-secret-key
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

### 10.3 Environment Configuration

**Backend .env (Production):**
```bash
# .env.production

# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://admin:${DB_PASSWORD}@guest-pass-db.xxxx.us-east-1.rds.amazonaws.com:5432/guestpass
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://guest-pass-cache.xxxx.0001.use1.cache.amazonaws.com:6379
REDIS_TTL=3600

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# AWS
AWS_REGION=us-east-1
AWS_S3_BUCKET=grand-city-visitor-photos
AWS_CLOUDFRONT_URL=https://dxxxxx.cloudfront.net

# Email (SES)
AWS_SES_FROM_EMAIL=noreply@grandcity.pk
AWS_SES_REGION=us-east-1

# SMS (SNS)
AWS_SNS_REGION=us-east-1

# QR Code
QR_CODE_SECRET=${QR_SECRET}
QR_CODE_EXPIRY_HOURS=24

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
LOG_LEVEL=info

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=300
```

**Frontend .env (Production):**
```bash
# .env.production

VITE_API_BASE_URL=https://api.grandcity.pk/api/v1
VITE_WS_URL=wss://api.grandcity.pk/ws
VITE_APP_NAME=Grand City Guest Pass System
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN=${SENTRY_DSN_FRONTEND}
```

### 10.4 Deployment Steps

**Step 1: Prepare Infrastructure**
```bash
# Clone repository
git clone https://github.com/grandcity/guest-pass-system.git
cd guest-pass-system

# Initialize Terraform
cd terraform
terraform init
terraform plan
terraform apply

# Note down outputs (RDS endpoint, Redis endpoint, etc.)
```

**Step 2: Build Docker Images**
```bash
# Build backend
cd backend
docker build -t guest-pass-backend:latest .
docker tag guest-pass-backend:latest ${ECR_REGISTRY}/guest-pass-backend:latest
docker push ${ECR_REGISTRY}/guest-pass-backend:latest

# Build frontend
cd ../frontend
docker build -t guest-pass-frontend:latest .
docker tag guest-pass-frontend:latest ${ECR_REGISTRY}/guest-pass-frontend:latest
docker push ${ECR_REGISTRY}/guest-pass-frontend:latest
```

**Step 3: Deploy to ECS**
```bash
# Update ECS task definitions
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Update ECS services
aws ecs update-service \
  --cluster guest-pass-cluster \
  --service guest-pass-backend-service \
  --task-definition guest-pass-backend:latest \
  --force-new-deployment

aws ecs update-service \
  --cluster guest-pass-cluster \
  --service guest-pass-frontend-service \
  --task-definition guest-pass-frontend:latest \
  --force-new-deployment
```

**Step 4: Run Database Migrations**
```bash
# Connect to RDS
psql -h guest-pass-db.xxxx.us-east-1.rds.amazonaws.com -U admin -d guestpass

# Run migrations
npm run migrate:up

# Seed initial data (executives, admin users)
npm run seed:prod
```

**Step 5: Configure SSL Certificate**
```bash
# Request certificate from ACM
aws acm request-certificate \
  --domain-name guests.grandcity.pk \
  --validation-method DNS \
  --subject-alternative-names api.grandcity.pk

# Attach to ALB listener
aws elbv2 modify-listener \
  --listener-arn ${ALB_LISTENER_ARN} \
  --certificates CertificateArn=${CERTIFICATE_ARN}
```

**Step 6: Configure DNS**
```bash
# Create Route 53 records
aws route53 change-resource-record-sets \
  --hosted-zone-id ${HOSTED_ZONE_ID} \
  --change-batch file://dns-changes.json
```

**Step 7: Verify Deployment**
```bash
# Health check
curl https://api.grandcity.pk/health

# Test authentication
curl -X POST https://api.grandcity.pk/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@grandcity.pk","password":"***"}'

# Access frontend
open https://guests.grandcity.pk
```

### 10.5 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/guest-pass-backend:${{ github.sha }} .
          docker push $ECR_REGISTRY/guest-pass-backend:${{ github.sha }}
      
      - name: Build and push frontend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          cd frontend
          docker build -t $ECR_REGISTRY/guest-pass-frontend:${{ github.sha }} .
          docker push $ECR_REGISTRY/guest-pass-frontend:${{ github.sha }}
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster guest-pass-cluster \
            --service guest-pass-backend-service \
            --force-new-deployment
```

---

## 11. Compliance & Reporting

### 11.1 Weekly Compliance Report Structure

**Report Components:**

1. **Executive Summary**
   - Total visits across all executives
   - Overall compliance score
   - Key metrics comparison (week-over-week)
   - Critical incidents or alerts

2. **Per-Executive Breakdown**
   - Total scheduled vs. actual visits
   - Approval rate and average approval time
   - No-show rate
   - Walk-in vs. scheduled ratio
   - Average visitor wait time

3. **Security Metrics**
   - Blacklisted visitor access attempts
   - Invalid QR code scans
   - After-hours access requests
   - Security incidents logged

4. **System Health**
   - Uptime percentage
   - Average API response time
   - Failed authentication attempts
   - Data backup status

**Compliance Score Calculation:**
```typescript
function calculateComplianceScore(weekData: WeekData): number {
  let score = 100;
  
  // Deduct for no-shows (each no-show = -1 point)
  score -= weekData.noShows * 1;
  
  // Deduct for late check-ins (>15 min late = -0.5 point)
  score -= weekData.lateCheckIns * 0.5;
  
  // Deduct for missing information (-2 points per incident)
  score -= weekData.incompleteRecords * 2;
  
  // Deduct for security incidents (-5 points each)
  score -= weekData.securityIncidents * 5;
  
  // Bonus for 100% scheduled visits (+5 points)
  if (weekData.walkInPercent === 0) score += 5;
  
  return Math.max(0, Math.min(100, score));
}
```

### 11.2 Audit Trail Requirements

**Regulatory Compliance:**
- ISO 27001 alignment
- GDPR compliance (if applicable)
- Local data protection laws (Pakistan)

**Audit Log Retention:**
- Active logs: 90 days in primary database
- Archive logs: 2 years in S3 Glacier
- Critical events: 7 years retention

**Auditable Events:**
- All visitor data creation/modification
- All visit approvals and rejections
- All check-in/check-out events
- All blacklist modifications
- All user account changes
- All system configuration changes

### 11.3 Data Privacy & Protection

**Visitor Data Handling:**
- CNIC encryption at rest
- Photo access controls (signed URLs, 15-min expiry)
- Data retention policy (3 years, then auto-archive)
- Right to erasure (upon request)
- Data export capability

**Executive Privacy:**
- Calendar data is private by default
- Cross-executive visibility prohibited
- Admin access logged and monitored
- Visitor details anonymized in reports

---

## Conclusion

This Guest Pass Management System provides Grand City HQ with a comprehensive, secure, and scalable solution for visitor management. The architecture ensures:

✅ **Elimination of walk-in disruptions** through pre-scheduled appointments  
✅ **Controlled access** via QR code validation and multi-level approvals  
✅ **Real-time visibility** for executives, staff, and security personnel  
✅ **Comprehensive audit trails** for compliance and security  
✅ **Weekly reports** for management oversight  
✅ **Scalable cloud infrastructure** ready for future growth

**Next Steps:**
1. Review and approve architecture
2. Allocate budget and resources
3. Begin Phase 1 implementation
4. Schedule kickoff meeting with stakeholders

---

**Document Control:**
- **Version:** 1.0
- **Last Updated:** December 4, 2025
- **Next Review:** After Phase 2 completion
- **Contact:** Ali Bin Nadeem - ali.nadeem@grandcity.pk

---
