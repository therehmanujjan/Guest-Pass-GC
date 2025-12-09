# API Documentation - Guest Pass Management System

## Base URL

```
Production: https://api.guestpass.grandcity.com.pk/v1
Staging: https://staging-api.guestpass.grandcity.com.pk/v1
Development: http://localhost:3000/api/v1
```

---

## Authentication

### JWT-Based Authentication

All API requests (except login/register) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Token Structure
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "executive|staff|guard|reception",
  "exp": 1735689600,
  "iat": 1735603200
}
```

### Token Expiry
- **Access Token:** 24 hours
- **Refresh Token:** 7 days

---

## API Endpoints

### 1. Authentication & Authorization

#### 1.1 Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "khalid.noon@grandcity.com.pk",
  "password": "SecurePassword123!",
  "remember_me": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": "u3333333-3333-3333-3333-333333333333",
      "email": "khalid.noon@grandcity.com.pk",
      "full_name": "Khalid Noon",
      "role": "executive",
      "profile_photo_url": "https://s3.amazonaws.com/...",
      "last_login_at": "2024-12-04T10:30:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 86400
    }
  }
}
```

#### 1.2 Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 1.3 Logout
```http
POST /auth/logout
```

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 1.4 Change Password
```http
PUT /auth/change-password
```

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!",
  "confirm_password": "NewPassword456!"
}
```

---

### 2. Visitors Management

#### 2.1 Create Visitor (Pre-registration)
```http
POST /visitors
```

**Request Body:**
```json
{
  "full_name": "Ahmed Khan",
  "email": "ahmed.khan@example.com",
  "phone_number": "+92-300-1234567",
  "cnic": "12345-6789012-3",
  "company_name": "ABC Corporation",
  "designation": "Marketing Director",
  "visitor_type": "business",
  "address": "123 Main Street, Lahore",
  "notes": "Frequent visitor, VIP status"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "visitor_id": "v1234567-1234-1234-1234-123456789012",
    "full_name": "Ahmed Khan",
    "phone_number": "+92-300-1234567",
    "visitor_type": "business",
    "risk_level": "low",
    "is_blacklisted": false,
    "created_at": "2024-12-04T10:30:00Z"
  }
}
```

#### 2.2 Get Visitor by ID
```http
GET /visitors/:visitor_id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "visitor_id": "v1234567-1234-1234-1234-123456789012",
    "full_name": "Ahmed Khan",
    "email": "ahmed.khan@example.com",
    "phone_number": "+92-300-1234567",
    "cnic": "12345-6789012-3",
    "company_name": "ABC Corporation",
    "designation": "Marketing Director",
    "visitor_type": "business",
    "risk_level": "low",
    "total_visits": 5,
    "last_visit_date": "2024-11-15T14:30:00Z",
    "is_blacklisted": false,
    "visit_history": [
      {
        "visit_id": "visit1",
        "purpose": "Business meeting",
        "visit_date": "2024-11-15T14:30:00Z",
        "executive_name": "Khalid Noon"
      }
    ]
  }
}
```

#### 2.3 Search Visitors
```http
GET /visitors/search?q=ahmed&type=business&page=1&limit=20
```

**Query Parameters:**
- `q`: Search query (name, email, phone, CNIC)
- `type`: Visitor type filter
- `blacklisted`: true/false
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "visitors": [
      {
        "visitor_id": "v1234567",
        "full_name": "Ahmed Khan",
        "phone_number": "+92-300-1234567",
        "company_name": "ABC Corporation",
        "total_visits": 5,
        "last_visit_date": "2024-11-15T14:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_records": 52,
      "per_page": 20
    }
  }
}
```

#### 2.4 Upload Visitor Photo
```http
POST /visitors/:visitor_id/photo
Content-Type: multipart/form-data
```

**Form Data:**
- `photo`: Image file (JPG, PNG, max 5MB)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "photo_url": "https://s3.amazonaws.com/guest-pass/visitors/v1234567/photo.jpg"
  }
}
```

---

### 3. Visits Management

#### 3.1 Create Scheduled Visit
```http
POST /visits
```

**Request Body:**
```json
{
  "visitor_id": "v1234567-1234-1234-1234-123456789012",
  "executive_id": "e3333333-3333-3333-3333-333333333333",
  "visit_type": "scheduled",
  "purpose": "Quarterly business review meeting",
  "scheduled_start_time": "2024-12-10T14:00:00Z",
  "scheduled_end_time": "2024-12-10T15:30:00Z",
  "location_id": "l3333333-3333-3333-3333-333333333333",
  "department_id": "d1111111-1111-1111-1111-111111111111",
  "number_of_guests": 1,
  "has_vehicle": true,
  "vehicle_registration": "LEA-1234",
  "meeting_room": "Conference Room A",
  "special_instructions": "Visitor requires parking access"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "visit_id": "visit123-1234-1234-1234-123456789012",
    "visitor": {
      "full_name": "Ahmed Khan",
      "phone_number": "+92-300-1234567"
    },
    "executive": {
      "full_name": "Khalid Noon",
      "title": "CEO"
    },
    "scheduled_start_time": "2024-12-10T14:00:00Z",
    "scheduled_end_time": "2024-12-10T15:30:00Z",
    "status": "scheduled",
    "pass": {
      "pass_id": "pass123",
      "pass_number": "GC-2024-12-0045",
      "qr_code_image_url": "https://s3.amazonaws.com/..."
    }
  },
  "message": "Visit scheduled successfully. Pass sent via email and SMS."
}
```

#### 3.2 Create Walk-in Visit
```http
POST /visits/walk-in
```

**Request Body:**
```json
{
  "visitor": {
    "full_name": "Sara Ahmed",
    "phone_number": "+92-300-9876543",
    "cnic": "12345-6789012-4",
    "company_name": "XYZ Enterprises",
    "visitor_type": "business"
  },
  "executive_id": "e3333333-3333-3333-3333-333333333333",
  "purpose": "Urgent business matter",
  "location_id": "l1111111-1111-1111-1111-111111111111",
  "requires_approval": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "visit_id": "visit124",
    "visitor_id": "v9876543",
    "status": "pending_approval",
    "approval_status": "pending",
    "message": "Walk-in visit registered. Awaiting executive approval."
  }
}
```

#### 3.3 Get Visits (Calendar View)
```http
GET /visits?start_date=2024-12-01&end_date=2024-12-31&executive_id=e3333333&status=scheduled
```

**Query Parameters:**
- `start_date`: Filter by date range
- `end_date`: Filter by date range
- `executive_id`: Filter by executive
- `status`: scheduled, checked_in, checked_out, etc.
- `visit_type`: scheduled, walk_in
- `page`: Page number
- `limit`: Results per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "visit_id": "visit123",
        "visitor": {
          "full_name": "Ahmed Khan",
          "company_name": "ABC Corporation"
        },
        "executive": {
          "full_name": "Khalid Noon",
          "title": "CEO"
        },
        "purpose": "Quarterly business review",
        "scheduled_start_time": "2024-12-10T14:00:00Z",
        "scheduled_end_time": "2024-12-10T15:30:00Z",
        "status": "scheduled",
        "pass_number": "GC-2024-12-0045"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_records": 98
    }
  }
}
```

#### 3.4 Update Visit
```http
PUT /visits/:visit_id
```

**Request Body:**
```json
{
  "scheduled_start_time": "2024-12-10T15:00:00Z",
  "scheduled_end_time": "2024-12-10T16:30:00Z",
  "meeting_room": "Conference Room B",
  "special_instructions": "Updated: Visitor will arrive 30 minutes late"
}
```

#### 3.5 Cancel Visit
```http
DELETE /visits/:visit_id
```

**Request Body:**
```json
{
  "cancellation_reason": "Meeting postponed to next week"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visit cancelled successfully. Notifications sent."
}
```

#### 3.6 Approve/Reject Walk-in
```http
POST /visits/:visit_id/approve
```

**Request Body:**
```json
{
  "approval_status": "approved",
  "notes": "Approved for urgent business discussion"
}
```

or

```json
{
  "approval_status": "rejected",
  "rejection_reason": "Executive unavailable today"
}
```

---

### 4. Pass Management

#### 4.1 Get Pass by Visit ID
```http
GET /passes/visit/:visit_id
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "pass_id": "pass123",
    "visit_id": "visit123",
    "pass_number": "GC-2024-12-0045",
    "pass_type": "single_entry",
    "qr_code_data": "encrypted_json_data",
    "qr_code_image_url": "https://s3.amazonaws.com/...",
    "valid_from": "2024-12-10T13:00:00Z",
    "valid_until": "2024-12-10T18:00:00Z",
    "is_active": true,
    "entries_used": 0,
    "max_entries": 1,
    "visitor": {
      "full_name": "Ahmed Khan",
      "phone_number": "+92-300-1234567"
    },
    "executive": {
      "full_name": "Khalid Noon",
      "title": "CEO"
    }
  }
}
```

#### 4.2 Verify Pass (QR Scan)
```http
POST /passes/verify
```

**Request Body:**
```json
{
  "qr_code_data": "encrypted_qr_content",
  "scan_type": "check_in",
  "location_id": "l1111111-1111-1111-1111-111111111111",
  "device_info": {
    "device_id": "guard_mobile_001",
    "platform": "android"
  }
}
```

**Response (200 OK) - Valid Pass:**
```json
{
  "success": true,
  "data": {
    "scan_result": "valid",
    "pass": {
      "pass_number": "GC-2024-12-0045",
      "visitor_name": "Ahmed Khan",
      "executive_name": "Khalid Noon",
      "purpose": "Quarterly business review",
      "valid_until": "2024-12-10T18:00:00Z"
    },
    "action": "check_in_successful",
    "message": "Entry granted. Welcome Ahmed Khan!"
  }
}
```

**Response (403 Forbidden) - Invalid Pass:**
```json
{
  "success": false,
  "error": {
    "code": "PASS_EXPIRED",
    "message": "This pass has expired",
    "scan_result": "expired"
  }
}
```

#### 4.3 Check-in Visitor
```http
POST /passes/:pass_id/check-in
```

**Request Body:**
```json
{
  "location_id": "l1111111-1111-1111-1111-111111111111",
  "notes": "Visitor arrived on time"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "visit_id": "visit123",
    "actual_check_in_time": "2024-12-10T14:00:23Z",
    "status": "checked_in",
    "message": "Visitor checked in successfully"
  }
}
```

#### 4.4 Check-out Visitor
```http
POST /passes/:pass_id/check-out
```

**Request Body:**
```json
{
  "location_id": "l1111111-1111-1111-1111-111111111111",
  "notes": "Meeting concluded successfully"
}
```

#### 4.5 Revoke Pass
```http
POST /passes/:pass_id/revoke
```

**Request Body:**
```json
{
  "revocation_reason": "Visit cancelled by executive"
}
```

---

### 5. Executives Management

#### 5.1 Get All Executives
```http
GET /executives
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "executive_id": "e3333333-3333-3333-3333-333333333333",
      "full_name": "Khalid Noon",
      "title": "CEO",
      "designation": "Chief Executive Officer",
      "office_location": "Building A, Floor 5, Room 501",
      "approval_required_for_walkins": true,
      "today_visits": {
        "scheduled": 3,
        "checked_in": 1,
        "completed": 2
      }
    },
    {
      "executive_id": "e1111111-1111-1111-1111-111111111111",
      "full_name": "Salman Bin Waris Gillani",
      "title": "MD Partner",
      "designation": "Managing Director Partner",
      "today_visits": {
        "scheduled": 5,
        "checked_in": 2,
        "completed": 1
      }
    }
  ]
}
```

#### 5.2 Get Executive Schedule
```http
GET /executives/:executive_id/schedule?date=2024-12-10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "executive": {
      "full_name": "Khalid Noon",
      "title": "CEO"
    },
    "date": "2024-12-10",
    "schedule": [
      {
        "visit_id": "visit123",
        "visitor_name": "Ahmed Khan",
        "company": "ABC Corporation",
        "purpose": "Quarterly review",
        "scheduled_start": "2024-12-10T14:00:00Z",
        "scheduled_end": "2024-12-10T15:30:00Z",
        "status": "scheduled"
      },
      {
        "visit_id": "visit124",
        "visitor_name": "Sara Ahmed",
        "company": "XYZ Enterprises",
        "purpose": "Partnership discussion",
        "scheduled_start": "2024-12-10T16:00:00Z",
        "scheduled_end": "2024-12-10T17:00:00Z",
        "status": "scheduled"
      }
    ],
    "summary": {
      "total_appointments": 2,
      "available_slots": 3
    }
  }
}
```

---

### 6. Reports & Analytics

#### 6.1 Generate Weekly Scrutiny Report
```http
POST /reports/weekly-scrutiny
```

**Request Body:**
```json
{
  "start_date": "2024-12-02",
  "end_date": "2024-12-08",
  "executive_ids": ["e3333333", "e1111111"],
  "format": "pdf"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "report_id": "report123",
    "report_name": "Weekly Scrutiny Report - Dec 2-8, 2024",
    "file_url": "https://s3.amazonaws.com/reports/weekly_scrutiny_20241208.pdf",
    "summary": {
      "total_visits": 145,
      "scheduled_visits": 120,
      "walk_in_visits": 25,
      "no_shows": 5,
      "average_duration_minutes": 45
    }
  }
}
```

#### 6.2 Get Dashboard Analytics
```http
GET /analytics/dashboard?period=today
```

**Query Parameters:**
- `period`: today, week, month, custom
- `start_date`: For custom period
- `end_date`: For custom period

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "today",
    "date": "2024-12-04",
    "summary": {
      "total_visits": 28,
      "scheduled": 22,
      "walk_ins": 6,
      "currently_checked_in": 8,
      "completed": 15,
      "no_shows": 2,
      "pending_approvals": 3
    },
    "by_executive": [
      {
        "executive_name": "Khalid Noon",
        "title": "CEO",
        "total_visits": 8,
        "checked_in": 3,
        "completed": 4
      }
    ],
    "by_hour": [
      {"hour": "09:00", "visits": 5},
      {"hour": "10:00", "visits": 8},
      {"hour": "11:00", "visits": 6}
    ],
    "top_visitors": [
      {
        "visitor_name": "Ahmed Khan",
        "company": "ABC Corporation",
        "visit_count": 3
      }
    ]
  }
}
```

#### 6.3 Get Visitor Analytics
```http
GET /analytics/visitors?period=month
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_unique_visitors": 340,
    "new_visitors": 85,
    "returning_visitors": 255,
    "by_type": {
      "business": 180,
      "personal": 60,
      "vendor": 50,
      "contractor": 30,
      "other": 20
    },
    "average_visit_duration_minutes": 42,
    "peak_hours": ["10:00-11:00", "14:00-15:00"]
  }
}
```

---

### 7. Audit Logs

#### 7.1 Get Audit Logs
```http
GET /audit-logs?start_date=2024-12-01&end_date=2024-12-31&user_id=u3333333&action=CREATE&page=1&limit=50
```

**Query Parameters:**
- `start_date`: Filter by date
- `end_date`: Filter by date
- `user_id`: Filter by user
- `entity_type`: visits, passes, users, etc.
- `action`: CREATE, UPDATE, DELETE, APPROVE, etc.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "audit_id": "audit123",
        "user": {
          "full_name": "Khalid Noon",
          "role": "executive"
        },
        "action": "APPROVE",
        "entity_type": "visits",
        "entity_id": "visit123",
        "changes": {
          "approval_status": {
            "old": "pending",
            "new": "approved"
          }
        },
        "ip_address": "192.168.1.100",
        "timestamp": "2024-12-04T10:30:45Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_records": 487
    }
  }
}
```

---

### 8. Notifications

#### 8.1 Get User Notifications
```http
GET /notifications?status=unread&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notification_id": "notif123",
        "type": "visit_approval_request",
        "title": "Walk-in Approval Required",
        "message": "Sara Ahmed from XYZ Enterprises requests immediate meeting",
        "visit_id": "visit124",
        "status": "unread",
        "created_at": "2024-12-04T10:25:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

#### 8.2 Mark Notification as Read
```http
PUT /notifications/:notification_id/read
```

---

### 9. Blacklist Management

#### 9.1 Add to Blacklist
```http
POST /blacklist
```

**Request Body:**
```json
{
  "visitor_id": "v1234567",
  "reason": "Security violation: Attempted unauthorized access",
  "expires_at": "2025-12-31T23:59:59Z"
}
```

#### 9.2 Get Blacklist
```http
GET /blacklist?is_active=true
```

#### 9.3 Remove from Blacklist
```http
DELETE /blacklist/:blacklist_id
```

**Request Body:**
```json
{
  "removal_notes": "Issue resolved, restrictions lifted"
}
```

---

## Real-Time WebSocket Events

### Connection
```javascript
const socket = io('wss://api.guestpass.grandcity.com.pk', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Events to Listen

#### New Visit Created
```javascript
socket.on('visit:created', (data) => {
  // data: { visit_id, visitor_name, executive_name, scheduled_time }
});
```

#### Visit Status Changed
```javascript
socket.on('visit:status_changed', (data) => {
  // data: { visit_id, old_status, new_status, timestamp }
});
```

#### Visitor Checked In
```javascript
socket.on('visitor:checked_in', (data) => {
  // data: { visit_id, visitor_name, check_in_time, location }
});
```

#### Approval Required
```javascript
socket.on('approval:required', (data) => {
  // data: { visit_id, visitor_name, executive_id, purpose }
});
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Validation error details"
    }
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Invalid or missing token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., duplicate) |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily down |

---

## Rate Limiting

- **Authentication endpoints:** 10 requests/minute
- **Standard API calls:** 100 requests/minute per user
- **Report generation:** 5 requests/hour
- **File uploads:** 20 requests/hour

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1735689600
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response Format:**
```json
{
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_records": 195,
    "per_page": 20,
    "has_next": true,
    "has_previous": false
  }
}
```

---

## API Versioning

Current version: **v1**

Version specified in URL: `/api/v1/`

When breaking changes are introduced, a new version will be released (v2) while maintaining v1 for backward compatibility.

---

## Testing

### Postman Collection
Available at: `https://api.guestpass.grandcity.com.pk/postman-collection.json`

### Test Credentials

**Executive:**
- Email: `khalid.noon@grandcity.com.pk`
- Password: `TestPass123!`

**Guard:**
- Email: `guard1@grandcity.com.pk`
- Password: `TestPass123!`

---

**API Version:** 1.0  
**Last Updated:** December 2024  
**Maintained by:** Ali Bin Nadeem, Technology Consultant
