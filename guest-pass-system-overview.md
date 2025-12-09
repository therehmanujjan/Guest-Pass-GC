# Grand City HQ - Guest Pass Management System
## Complete Production-Ready System Design

**Version:** 1.0  
**Date:** December 2024  
**Owner:** Ali Bin Nadeem, Technology Consultant  
**Organization:** Grand City HQ, Pakistan

---

## Executive Summary

The Guest Pass Management System (GPMS) is a cloud-based solution designed to eliminate walk-in disruptions and ensure controlled guest access for Grand City HQ's executive leadership. The system provides real-time visitor tracking, digital pass generation, QR-based verification, and comprehensive audit trails for compliance review.

### Key Stakeholders (C-Level Executives)
1. **Salman Bin Waris Gillani** – MD Partner
2. **Rehan Bin Waris Gillani** – Chairman Partner
3. **Khalid Noon** – CEO
4. **Shahnawaz** – Director Operations
5. **Muhammad Bin Waris Gillani** – Director Faisalabad & French Club
6. **Ch. Aslam** – CFO
7. **Ali Moeen** – Consultant
8. **Ali Bin Nadeem** – Technology Consultant

---

## System Objectives

### Primary Goals
- **Eliminate Disruptions:** Pre-scheduled appointments prevent unannounced walk-ins
- **Real-Time Validation:** QR-based instant verification at entry points
- **Complete Audit Trail:** Full database logging for compliance and security
- **Weekly Scrutiny:** Automated reports for executive review
- **Multi-Role Access:** Support for guards, receptionists, office boys, PSOs, and executives

### Business Impact
- **Security Enhancement:** 95% reduction in unauthorized access attempts
- **Time Savings:** 70% reduction in executive interruptions
- **Compliance Ready:** Full audit trail for security reviews
- **Professional Image:** Modern, streamlined visitor experience

---

## System Architecture

### Technology Stack

#### Frontend
- **Framework:** React 18+ with TypeScript
- **State Management:** Redux Toolkit + RTK Query
- **UI Library:** Material-UI (MUI) v5 + Custom Components
- **Real-Time:** Socket.io-client for live updates
- **QR Generation:** qrcode.react library
- **Calendar:** FullCalendar for appointment scheduling
- **Mobile:** Progressive Web App (PWA) for mobile devices

#### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js with TypeScript
- **API Style:** RESTful + GraphQL for complex queries
- **Real-Time:** Socket.io for push notifications
- **Authentication:** JWT + Refresh Tokens
- **Authorization:** Role-Based Access Control (RBAC)
- **File Storage:** AWS S3 for visitor photos/documents

#### Database
- **Primary DB:** PostgreSQL 15+ (AWS RDS or Supabase)
- **Caching:** Redis for session management and real-time data
- **Search:** PostgreSQL Full-Text Search or ElasticSearch
- **Backup:** Automated daily backups with 30-day retention

#### Cloud Infrastructure (AWS)
- **Compute:** AWS ECS (Fargate) or EC2 Auto Scaling
- **Load Balancer:** Application Load Balancer (ALB)
- **CDN:** CloudFront for static assets
- **Storage:** S3 for visitor photos and documents
- **Database:** RDS PostgreSQL Multi-AZ
- **Cache:** ElastiCache Redis
- **Monitoring:** CloudWatch + AWS X-Ray
- **Secrets:** AWS Secrets Manager
- **Email/SMS:** AWS SES + SNS

#### Alternative: Azure Stack
- **Compute:** Azure App Service or AKS
- **Load Balancer:** Azure Application Gateway
- **CDN:** Azure CDN
- **Storage:** Azure Blob Storage
- **Database:** Azure Database for PostgreSQL
- **Cache:** Azure Cache for Redis
- **Monitoring:** Azure Monitor + Application Insights

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Executive Dashboard  │  Staff Portal  │  Guard Mobile App  │
│  (React PWA)         │  (React Web)   │  (React PWA)       │
└──────────────┬────────────────┬─────────────────┬───────────┘
               │                │                 │
               └────────────────┼─────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   CloudFront CDN     │
                    │   (Static Assets)    │
                    └───────────┬──────────┘
                                │
                    ┌───────────▼──────────┐
                    │   Application Load   │
                    │      Balancer        │
                    └───────────┬──────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
   ┌────▼─────┐          ┌─────▼──────┐         ┌─────▼──────┐
   │  API     │          │   API      │         │   API      │
   │ Server 1 │          │  Server 2  │         │  Server 3  │
   │ (ECS)    │          │   (ECS)    │         │   (ECS)    │
   └────┬─────┘          └─────┬──────┘         └─────┬──────┘
        │                      │                       │
        └──────────────────────┼───────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼─────┐         ┌─────▼──────┐        ┌─────▼──────┐
   │   Redis  │         │ PostgreSQL │        │    S3      │
   │  Cache   │         │  Database  │        │  Storage   │
   │(ElastiCache)│      │   (RDS)    │        │  (Photos)  │
   └──────────┘         └────────────┘        └────────────┘
                               │
                        ┌──────▼───────┐
                        │   Backup     │
                        │   Storage    │
                        │   (S3)       │
                        └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
├─────────────────────────────────────────────────────────────┤
│  AWS SES (Email)  │  AWS SNS (SMS)  │  CloudWatch (Logs)   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                             │
└─────────────────────────────────────────────────────────────┘

1. SCHEDULED VISITOR FLOW
   Staff Portal → API Gateway → Validation → Database
   ↓
   Generate Pass → QR Code → Email/SMS Notification
   ↓
   Visitor Arrives → Guard Scans QR → Verify → Allow Entry
   ↓
   Real-time Update → Executive Dashboard → Audit Log

2. WALK-IN VISITOR FLOW
   Guard/Reception → Quick Registration Form → Capture Photo
   ↓
   Executive Approval (if required) → Generate Temporary Pass
   ↓
   QR Verification → Entry Granted → Audit Log

3. CHECKOUT FLOW
   Guard Scans QR → Mark Exit Time → Update Database
   ↓
   Calculate Duration → Close Visit Record → Audit Log
```

---

## System Components

### 1. Frontend Applications

#### A. Executive Dashboard
**Purpose:** High-level overview for C-level executives
**Features:**
- Calendar view of all scheduled appointments
- Real-time visitor status (pending, checked-in, checked-out)
- Quick approval/rejection of walk-in requests
- Weekly/monthly analytics and reports
- Visitor history and search
- Security alerts and notifications

#### B. Staff Portal (Web)
**Purpose:** Administrative interface for scheduling and management
**Features:**
- Full calendar management (create, edit, cancel appointments)
- Visitor pre-registration with complete details
- Bulk pass generation for recurring visitors
- Document upload (ID, authorization letters)
- Search and filter visitor history
- Report generation and export

#### C. Guard/Reception Mobile App (PWA)
**Purpose:** Field operations for entry/exit management
**Features:**
- QR code scanner for pass verification
- Quick walk-in registration form
- Photo capture for visitor records
- Real-time pass validation
- Offline mode with sync when online
- Emergency alerts and notifications

### 2. Backend Services

#### A. Authentication Service
- JWT-based authentication
- Role-based access control (RBAC)
- Multi-factor authentication (optional)
- Session management with Redis
- Password policies and rotation

#### B. Visitor Management Service
- CRUD operations for visitor records
- Pass generation with QR codes
- Visit scheduling and calendar management
- Walk-in registration and approval workflow
- Visit status tracking (scheduled, checked-in, checked-out)

#### C. Notification Service
- Email notifications (AWS SES)
- SMS notifications (AWS SNS)
- Push notifications for mobile apps
- Real-time Socket.io updates
- Notification templates and scheduling

#### D. Reporting Service
- Weekly scrutiny reports
- Executive summaries
- Audit trail queries
- Analytics and trends
- Export to PDF/Excel

#### E. Audit Service
- Complete action logging
- User activity tracking
- Security event monitoring
- Compliance reporting
- Data retention policies

### 3. Database Design

#### Core Tables
1. **users** - System users (staff, executives, guards)
2. **visitors** - Guest information and records
3. **visits** - Individual visit instances
4. **passes** - Generated pass records with QR codes
5. **executives** - C-level executive profiles
6. **audit_logs** - Complete system audit trail
7. **notifications** - Notification queue and history
8. **departments** - Organizational units
9. **locations** - Physical locations and entry points
10. **blacklist** - Restricted visitors

---

## Security Architecture

### Authentication & Authorization

#### Role Hierarchy
```
Super Admin (IT/Technology Consultant)
├── Executive (C-Level)
│   ├── View all visits
│   ├── Approve/reject walk-ins
│   └── Access all reports
├── Staff/EA (Executive Assistant)
│   ├── Schedule appointments
│   ├── Manage executive calendar
│   └── Generate passes
├── Reception/Admin
│   ├── Walk-in registration
│   ├── Pass verification
│   └── Basic reports
└── Guard/Security
    ├── QR scanning
    ├── Walk-in entry
    └── Exit recording
```

### Data Security

#### Encryption
- **In Transit:** TLS 1.3 for all API communication
- **At Rest:** AES-256 encryption for database
- **Sensitive Data:** Field-level encryption for PII
- **Passwords:** bcrypt with salt (cost factor 12)

#### Access Control
- **API Gateway:** Rate limiting (100 req/min per user)
- **IP Whitelisting:** Optional for executive access
- **Session Management:** 24-hour JWT expiry, 7-day refresh tokens
- **CORS:** Strict origin validation

#### Audit Trail
- **Immutable Logs:** All actions logged with timestamp
- **User Actions:** Who did what, when, and from where
- **Data Changes:** Before/after values for all updates
- **Retention:** 2 years for compliance

---

## Scalability Considerations

### Horizontal Scaling
- **Auto Scaling:** ECS services scale based on CPU/memory
- **Load Balancing:** ALB distributes traffic across instances
- **Database:** Read replicas for reporting queries
- **Cache:** Redis cluster for session distribution

### Performance Optimization
- **CDN:** CloudFront for global content delivery
- **Database Indexing:** Strategic indexes on high-query columns
- **Query Optimization:** N+1 prevention, batch operations
- **Caching Strategy:** 
  - Session data: 24 hours
  - Static data: 7 days
  - API responses: 5 minutes (configurable)

### Capacity Planning
- **Expected Load:** 500 visitors/day, 2000 active passes/month
- **Peak Hours:** 9-11 AM (60% of daily traffic)
- **Database Size:** ~50GB/year
- **Storage:** ~500GB/year (photos and documents)

---

## Deployment Strategy

### Environment Structure
```
Development → Staging → Production
├── Dev: Feature testing
├── Staging: Pre-production validation
└── Production: Live system
```

### CI/CD Pipeline
1. **Code Commit** → GitHub/GitLab
2. **Build** → GitHub Actions/GitLab CI
3. **Test** → Automated unit/integration tests
4. **Security Scan** → Snyk/SonarQube
5. **Deploy** → AWS ECS/Azure App Service
6. **Smoke Tests** → Automated validation
7. **Monitor** → CloudWatch/Application Insights

### Disaster Recovery
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 15 minutes
- **Backup Frequency:** Every 6 hours + transaction logs
- **Multi-AZ Deployment:** Database and application
- **Failover:** Automated with health checks

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up cloud infrastructure (AWS/Azure)
- [ ] Database schema design and implementation
- [ ] Authentication and authorization system
- [ ] Basic API endpoints (users, visitors, visits)
- [ ] Admin dashboard MVP

### Phase 2: Core Features (Weeks 5-8)
- [ ] Calendar-based scheduling system
- [ ] QR code generation and validation
- [ ] Walk-in registration workflow
- [ ] Email/SMS notifications
- [ ] Executive dashboard

### Phase 3: Mobile & Field Operations (Weeks 9-12)
- [ ] Guard/reception mobile PWA
- [ ] QR scanner integration
- [ ] Photo capture and upload
- [ ] Offline mode functionality
- [ ] Real-time updates (Socket.io)

### Phase 4: Reporting & Analytics (Weeks 13-15)
- [ ] Weekly scrutiny reports
- [ ] Executive analytics dashboard
- [ ] Audit trail viewer
- [ ] Export functionality (PDF/Excel)
- [ ] Custom report builder

### Phase 5: Testing & Deployment (Weeks 16-18)
- [ ] Comprehensive testing (unit, integration, E2E)
- [ ] Security audit and penetration testing
- [ ] Performance testing and optimization
- [ ] User acceptance testing (UAT)
- [ ] Production deployment

### Phase 6: Training & Rollout (Weeks 19-20)
- [ ] Staff training sessions
- [ ] Executive orientation
- [ ] Guard training and mobile app onboarding
- [ ] Documentation and user guides
- [ ] Go-live and monitoring

---

## Cost Estimation (Monthly, AWS)

| Service | Specification | Cost (USD) |
|---------|--------------|------------|
| ECS Fargate | 3 tasks, 1 vCPU, 2GB RAM | $75 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | $140 |
| ElastiCache Redis | cache.t3.micro | $15 |
| S3 Storage | 500GB, Standard | $12 |
| CloudFront | 1TB transfer | $85 |
| ALB | Standard | $25 |
| SES | 10,000 emails/month | $1 |
| SNS | 1,000 SMS/month (Pakistan) | $15 |
| CloudWatch | Logs and monitoring | $20 |
| **Total Estimated** | | **~$388/month** |

**Annual Cost:** ~PKR 1,300,000 (at 280 PKR/USD)

---

## Success Metrics

### Key Performance Indicators (KPIs)

1. **System Availability:** 99.5% uptime
2. **Response Time:** <500ms for API calls
3. **Pass Generation:** <30 seconds end-to-end
4. **QR Scan Time:** <3 seconds for verification
5. **User Adoption:** 90% staff usage within 2 months
6. **Security Incidents:** Zero unauthorized access

### Business Metrics

1. **Visitor Processing Time:** 70% reduction
2. **Executive Interruptions:** 95% reduction in walk-ins
3. **Compliance Readiness:** 100% audit trail coverage
4. **User Satisfaction:** >4.5/5 rating
5. **Cost Savings:** 60% reduction in manual processes

---

## Next Steps

1. **Stakeholder Approval:** Review with Khalid Noon (CEO) and Shahnawaz (Director Operations)
2. **Budget Allocation:** Approve PKR 1.3M annual cloud infrastructure budget
3. **Team Formation:** Assign 2 frontend, 2 backend, 1 DevOps engineers
4. **Vendor Selection:** Finalize AWS vs Azure decision
5. **Project Kickoff:** Week 1 initiation with detailed planning

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2024 | Ali Bin Nadeem | Initial system design |

**Prepared by:** Ali Bin Nadeem, Technology Consultant  
**For:** Grand City HQ Executive Leadership
