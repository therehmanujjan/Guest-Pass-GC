# Database Schema Design - Guest Pass Management System

## Entity Relationship Diagram (ERD)

### Core Entities and Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA OVERVIEW                     │
└─────────────────────────────────────────────────────────────────┘

users (1) ────── (M) visits
executives (1) ─── (M) visits
visitors (1) ───── (M) visits
visits (1) ──────── (1) passes
visits (M) ──────── (1) locations
visits (M) ──────── (1) departments
visits (1) ──────── (M) audit_logs
users (1) ───────── (M) audit_logs
visitors (M) ─────── (M) blacklist
```

---

## Complete PostgreSQL Schema

### 1. Users Table (System Users: Staff, Executives, Guards)

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'executive', 'staff', 'reception', 'guard', 'pso')),
    department_id UUID REFERENCES departments(department_id),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

### 2. Executives Table (C-Level Leadership)

```sql
CREATE TABLE executives (
    executive_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, -- MD Partner, CEO, Chairman, etc.
    designation VARCHAR(255) NOT NULL,
    office_location VARCHAR(255),
    assistant_user_id UUID REFERENCES users(user_id), -- Executive Assistant
    approval_required_for_walkins BOOLEAN DEFAULT TRUE,
    max_daily_appointments INTEGER DEFAULT 10,
    preferred_meeting_duration INTEGER DEFAULT 30, -- minutes
    office_hours_start TIME,
    office_hours_end TIME,
    bio TEXT,
    priority_level INTEGER DEFAULT 1, -- 1 highest, 5 lowest
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_executives_user ON executives(user_id);
CREATE INDEX idx_executives_assistant ON executives(assistant_user_id);
```

### 3. Departments Table

```sql
CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    head_user_id UUID REFERENCES users(user_id),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_head ON departments(head_user_id);
```

### 4. Locations Table (Physical Entry Points)

```sql
CREATE TABLE locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    building VARCHAR(100),
    floor VARCHAR(50),
    entry_point_type VARCHAR(50) CHECK (entry_point_type IN ('main_gate', 'building_lobby', 'floor_reception', 'parking')),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    guard_assigned_user_id UUID REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_entry_type ON locations(entry_point_type);
CREATE INDEX idx_locations_guard ON locations(guard_assigned_user_id);
```

### 5. Visitors Table (Guest Master Records)

```sql
CREATE TABLE visitors (
    visitor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20) NOT NULL,
    cnic VARCHAR(20), -- Computerized National Identity Card (Pakistan)
    passport_number VARCHAR(50),
    company_name VARCHAR(255),
    designation VARCHAR(255),
    address TEXT,
    photo_url TEXT, -- S3 URL
    id_document_url TEXT, -- S3 URL
    visitor_type VARCHAR(50) CHECK (visitor_type IN ('business', 'personal', 'vendor', 'contractor', 'government', 'media', 'other')),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'low',
    notes TEXT,
    total_visits INTEGER DEFAULT 0,
    last_visit_date TIMESTAMP WITH TIME ZONE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visitors_phone ON visitors(phone_number);
CREATE INDEX idx_visitors_cnic ON visitors(cnic);
CREATE INDEX idx_visitors_email ON visitors(email);
CREATE INDEX idx_visitors_blacklist ON visitors(is_blacklisted);
CREATE INDEX idx_visitors_type ON visitors(visitor_type);
```

### 6. Visits Table (Individual Visit Instances)

```sql
CREATE TABLE visits (
    visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL REFERENCES visitors(visitor_id),
    executive_id UUID NOT NULL REFERENCES executives(executive_id),
    host_user_id UUID REFERENCES users(user_id), -- Staff member hosting
    visit_type VARCHAR(50) NOT NULL CHECK (visit_type IN ('scheduled', 'walk_in')),
    purpose TEXT NOT NULL,
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    scheduled_end_time TIMESTAMP WITH TIME ZONE,
    actual_check_in_time TIMESTAMP WITH TIME ZONE,
    actual_check_out_time TIMESTAMP WITH TIME ZONE,
    location_id UUID REFERENCES locations(location_id),
    department_id UUID REFERENCES departments(department_id),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pending_approval', 'approved', 'rejected', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
    approval_status VARCHAR(50) CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    number_of_guests INTEGER DEFAULT 1,
    has_vehicle BOOLEAN DEFAULT FALSE,
    vehicle_registration VARCHAR(50),
    items_carried TEXT, -- Laptop, bags, etc.
    escort_required BOOLEAN DEFAULT FALSE,
    escort_user_id UUID REFERENCES users(user_id),
    meeting_room VARCHAR(100),
    special_instructions TEXT,
    internal_notes TEXT, -- Staff/security notes
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    checked_in_by UUID REFERENCES users(user_id),
    checked_out_by UUID REFERENCES users(user_id),
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_visits_visitor ON visits(visitor_id);
CREATE INDEX idx_visits_executive ON visits(executive_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_type ON visits(visit_type);
CREATE INDEX idx_visits_scheduled_start ON visits(scheduled_start_time);
CREATE INDEX idx_visits_check_in ON visits(actual_check_in_time);
CREATE INDEX idx_visits_approval ON visits(approval_status);
```

### 7. Passes Table (Digital Pass with QR Code)

```sql
CREATE TABLE passes (
    pass_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID UNIQUE NOT NULL REFERENCES visits(visit_id) ON DELETE CASCADE,
    pass_number VARCHAR(50) UNIQUE NOT NULL, -- GC-2024-12-0001
    qr_code_data TEXT NOT NULL, -- Encrypted JSON
    qr_code_image_url TEXT, -- S3 URL
    pass_type VARCHAR(50) CHECK (pass_type IN ('single_entry', 'multiple_entry', 'temporary', 'permanent')),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    max_entries INTEGER DEFAULT 1,
    entries_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(user_id),
    revocation_reason TEXT,
    access_level VARCHAR(50) DEFAULT 'visitor', -- visitor, contractor, vendor
    allowed_areas TEXT[], -- Array of location IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passes_visit ON passes(visit_id);
CREATE INDEX idx_passes_number ON passes(pass_number);
CREATE INDEX idx_passes_active ON passes(is_active);
CREATE INDEX idx_passes_validity ON passes(valid_from, valid_until);
```

### 8. Pass Scans Table (QR Scan History)

```sql
CREATE TABLE pass_scans (
    scan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID NOT NULL REFERENCES passes(pass_id),
    scanned_by UUID NOT NULL REFERENCES users(user_id),
    location_id UUID REFERENCES locations(location_id),
    scan_type VARCHAR(20) CHECK (scan_type IN ('check_in', 'check_out', 'verification')),
    scan_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scan_result VARCHAR(20) CHECK (scan_result IN ('valid', 'invalid', 'expired', 'revoked', 'already_used')),
    device_info JSONB, -- Device details
    gps_coordinates POINT, -- lat/long
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pass_scans_pass ON pass_scans(pass_id);
CREATE INDEX idx_pass_scans_user ON pass_scans(scanned_by);
CREATE INDEX idx_pass_scans_time ON pass_scans(scan_time);
CREATE INDEX idx_pass_scans_result ON pass_scans(scan_result);
```

### 9. Blacklist Table

```sql
CREATE TABLE blacklist (
    blacklist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID REFERENCES visitors(visitor_id),
    cnic VARCHAR(20),
    phone_number VARCHAR(20),
    reason TEXT NOT NULL,
    blacklisted_by UUID NOT NULL REFERENCES users(user_id),
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent
    is_active BOOLEAN DEFAULT TRUE,
    removal_notes TEXT,
    removed_by UUID REFERENCES users(user_id),
    removed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blacklist_visitor ON blacklist(visitor_id);
CREATE INDEX idx_blacklist_cnic ON blacklist(cnic);
CREATE INDEX idx_blacklist_phone ON blacklist(phone_number);
CREATE INDEX idx_blacklist_active ON blacklist(is_active);
```

### 10. Notifications Table

```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    visitor_id UUID REFERENCES visitors(visitor_id),
    visit_id UUID REFERENCES visits(visit_id),
    notification_type VARCHAR(50) CHECK (notification_type IN ('email', 'sms', 'push', 'in_app')),
    channel VARCHAR(50),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    subject VARCHAR(500),
    message TEXT NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'read')) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

### 11. Audit Logs Table

```sql
CREATE TABLE audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    entity_type VARCHAR(100) NOT NULL, -- visits, passes, users, etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, APPROVE, REJECT, etc.
    changes JSONB, -- Before/after values
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

### 12. System Settings Table

```sql
CREATE TABLE system_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(50) CHECK (data_type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_category ON system_settings(category);
CREATE INDEX idx_settings_key ON system_settings(key);
```

### 13. Reports Table (Saved Reports)

```sql
CREATE TABLE reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) CHECK (report_type IN ('weekly_scrutiny', 'monthly_summary', 'executive_report', 'security_audit', 'visitor_analytics', 'custom')),
    generated_by UUID REFERENCES users(user_id),
    parameters JSONB,
    file_url TEXT, -- S3 URL
    file_format VARCHAR(20), -- PDF, XLSX, CSV
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) CHECK (status IN ('generating', 'completed', 'failed')) DEFAULT 'generating',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_generated_by ON reports(generated_by);
CREATE INDEX idx_reports_created ON reports(created_at);
```

---

## Initial Data Seeding

### Insert C-Level Executives

```sql
-- Insert departments
INSERT INTO departments (department_id, name, description) VALUES
('d1111111-1111-1111-1111-111111111111', 'Executive Management', 'C-Level Leadership'),
('d2222222-2222-2222-2222-222222222222', 'Operations', 'Operations Department'),
('d3333333-3333-3333-3333-333333333333', 'Finance', 'Finance & Accounting'),
('d4444444-4444-4444-4444-444444444444', 'Technology', 'IT & Technology'),
('d5555555-5555-5555-5555-555555555555', 'Faisalabad Operations', 'Faisalabad & French Club');

-- Insert executive users
INSERT INTO users (user_id, email, password_hash, full_name, role, department_id, phone_number) VALUES
('u1111111-1111-1111-1111-111111111111', 'salman.gillani@grandcity.com.pk', '$2b$12$...', 'Salman Bin Waris Gillani', 'executive', 'd1111111-1111-1111-1111-111111111111', '+92-300-1234567'),
('u2222222-2222-2222-2222-222222222222', 'rehan.gillani@grandcity.com.pk', '$2b$12$...', 'Rehan Bin Waris Gillani', 'executive', 'd1111111-1111-1111-1111-111111111111', '+92-300-1234568'),
('u3333333-3333-3333-3333-333333333333', 'khalid.noon@grandcity.com.pk', '$2b$12$...', 'Khalid Noon', 'executive', 'd1111111-1111-1111-1111-111111111111', '+92-300-1234569'),
('u4444444-4444-4444-4444-444444444444', 'shahnawaz@grandcity.com.pk', '$2b$12$...', 'Shahnawaz', 'executive', 'd2222222-2222-2222-2222-222222222222', '+92-300-1234570'),
('u5555555-5555-5555-5555-555555555555', 'muhammad.gillani@grandcity.com.pk', '$2b$12$...', 'Muhammad Bin Waris Gillani', 'executive', 'd5555555-5555-5555-5555-555555555555', '+92-300-1234571'),
('u6666666-6666-6666-6666-666666666666', 'ch.aslam@grandcity.com.pk', '$2b$12$...', 'Ch. Aslam', 'executive', 'd3333333-3333-3333-3333-333333333333', '+92-300-1234572'),
('u7777777-7777-7777-7777-777777777777', 'ali.moeen@grandcity.com.pk', '$2b$12$...', 'Ali Moeen', 'executive', 'd1111111-1111-1111-1111-111111111111', '+92-300-1234573'),
('u8888888-8888-8888-8888-888888888888', 'ali.nadeem@grandcity.com.pk', '$2b$12$...', 'Ali Bin Nadeem', 'super_admin', 'd4444444-4444-4444-4444-444444444444', '+92-300-1234574');

-- Insert executive profiles
INSERT INTO executives (executive_id, user_id, title, designation, approval_required_for_walkins, priority_level) VALUES
('e1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'MD Partner', 'Managing Director Partner', TRUE, 1),
('e2222222-2222-2222-2222-222222222222', 'u2222222-2222-2222-2222-222222222222', 'Chairman Partner', 'Chairman Partner', TRUE, 1),
('e3333333-3333-3333-3333-333333333333', 'u3333333-3333-3333-3333-333333333333', 'CEO', 'Chief Executive Officer', TRUE, 1),
('e4444444-4444-4444-4444-444444444444', 'u4444444-4444-4444-4444-444444444444', 'Director Operations', 'Director Operations', TRUE, 2),
('e5555555-5555-5555-5555-555555555555', 'u5555555-5555-5555-5555-555555555555', 'Director Faisalabad', 'Director Faisalabad & French Club', TRUE, 2),
('e6666666-6666-6666-6666-666666666666', 'u6666666-6666-6666-6666-666666666666', 'CFO', 'Chief Financial Officer', TRUE, 2),
('e7777777-7777-7777-7777-777777777777', 'u7777777-7777-7777-7777-777777777777', 'Consultant', 'Consultant', FALSE, 3);

-- Insert locations
INSERT INTO locations (location_id, name, building, entry_point_type) VALUES
('l1111111-1111-1111-1111-111111111111', 'Main Gate', 'Grand City HQ', 'main_gate'),
('l2222222-2222-2222-2222-222222222222', 'Building A Lobby', 'Building A', 'building_lobby'),
('l3333333-3333-3333-3333-333333333333', 'Executive Floor Reception', 'Building A - Floor 5', 'floor_reception');

-- Insert system settings
INSERT INTO system_settings (category, key, value, data_type, description) VALUES
('pass', 'default_validity_hours', '24', 'integer', 'Default pass validity in hours'),
('pass', 'qr_encryption_enabled', 'true', 'boolean', 'Enable QR code encryption'),
('notification', 'email_enabled', 'true', 'boolean', 'Enable email notifications'),
('notification', 'sms_enabled', 'true', 'boolean', 'Enable SMS notifications'),
('security', 'max_login_attempts', '5', 'integer', 'Maximum failed login attempts'),
('security', 'session_timeout_minutes', '1440', 'integer', 'Session timeout in minutes (24 hours)');
```

---

## Database Views for Common Queries

### Active Visits Today
```sql
CREATE VIEW v_active_visits_today AS
SELECT 
    v.visit_id,
    v.visit_type,
    vis.full_name as visitor_name,
    vis.phone_number,
    e.title as executive_title,
    u.full_name as executive_name,
    v.scheduled_start_time,
    v.actual_check_in_time,
    v.status,
    l.name as location_name
FROM visits v
JOIN visitors vis ON v.visitor_id = vis.visitor_id
JOIN executives e ON v.executive_id = e.executive_id
JOIN users u ON e.user_id = u.user_id
LEFT JOIN locations l ON v.location_id = l.location_id
WHERE DATE(v.scheduled_start_time) = CURRENT_DATE
AND v.status IN ('scheduled', 'checked_in', 'pending_approval');
```

### Executive Visit Summary
```sql
CREATE VIEW v_executive_visit_summary AS
SELECT 
    e.executive_id,
    u.full_name as executive_name,
    e.title,
    COUNT(v.visit_id) as total_visits,
    COUNT(CASE WHEN v.status = 'scheduled' THEN 1 END) as scheduled_visits,
    COUNT(CASE WHEN v.status = 'checked_in' THEN 1 END) as ongoing_visits,
    COUNT(CASE WHEN v.status = 'checked_out' THEN 1 END) as completed_visits,
    COUNT(CASE WHEN v.visit_type = 'walk_in' THEN 1 END) as walkin_visits
FROM executives e
JOIN users u ON e.user_id = u.user_id
LEFT JOIN visits v ON e.executive_id = v.executive_id
    AND DATE(v.scheduled_start_time) = CURRENT_DATE
GROUP BY e.executive_id, u.full_name, e.title;
```

---

## Database Functions and Triggers

### Auto-update Updated_at Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitors_updated_at BEFORE UPDATE ON visitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passes_updated_at BEFORE UPDATE ON passes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Generate Pass Number
```sql
CREATE OR REPLACE FUNCTION generate_pass_number()
RETURNS TEXT AS $$
DECLARE
    year_code TEXT;
    month_code TEXT;
    sequence_num TEXT;
BEGIN
    year_code := TO_CHAR(CURRENT_DATE, 'YYYY');
    month_code := TO_CHAR(CURRENT_DATE, 'MM');
    
    SELECT LPAD(CAST(COUNT(*) + 1 AS TEXT), 4, '0')
    INTO sequence_num
    FROM passes
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE);
    
    RETURN 'GC-' || year_code || '-' || month_code || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;
```

### Check Blacklist on Visitor Creation
```sql
CREATE OR REPLACE FUNCTION check_visitor_blacklist()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM blacklist 
        WHERE (cnic = NEW.cnic OR phone_number = NEW.phone_number)
        AND is_active = TRUE
    ) THEN
        NEW.is_blacklisted = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_blacklist_on_visitor_insert
BEFORE INSERT OR UPDATE ON visitors
FOR EACH ROW EXECUTE FUNCTION check_visitor_blacklist();
```

---

## Backup and Maintenance

### Daily Backup Script
```sql
-- Run via cron job
pg_dump -U postgres -h localhost -d guest_pass_db -F c -f /backups/guest_pass_$(date +%Y%m%d).backup
```

### Cleanup Old Audit Logs (Keep 2 years)
```sql
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs
    WHERE timestamp < CURRENT_DATE - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;
```

### Vacuum and Analyze
```sql
-- Run weekly
VACUUM ANALYZE visits;
VACUUM ANALYZE passes;
VACUUM ANALYZE pass_scans;
VACUUM ANALYZE audit_logs;
```

---

## Performance Optimization

### Partitioning for Audit Logs (by month)
```sql
CREATE TABLE audit_logs (
    -- columns as defined above
) PARTITION BY RANGE (timestamp);

CREATE TABLE audit_logs_2024_12 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

**Database Version:** PostgreSQL 15+  
**Character Set:** UTF8  
**Timezone:** Asia/Karachi (PKT)  
**Prepared by:** Ali Bin Nadeem, Technology Consultant
