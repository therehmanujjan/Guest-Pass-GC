-- =====================================================
-- GUEST PASS MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Grand City HQ
-- PostgreSQL 15.x
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM (
    'executive',
    'staff',
    'guard',
    'receptionist',
    'admin'
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

CREATE TYPE visit_type AS ENUM (
    'scheduled',
    'walk_in',
    'recurring'
);

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

CREATE TYPE notification_type AS ENUM (
    'visit_request',
    'visit_approved',
    'visit_rejected',
    'visitor_arrived',
    'visitor_waiting',
    'visit_reminder',
    'system_alert'
);

CREATE TYPE notification_channel AS ENUM (
    'email',
    'sms',
    'push',
    'in_app'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    executive_id UUID,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Executives table
CREATE TABLE executives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE,
    title VARCHAR(100) NOT NULL,
    position executive_position NOT NULL,
    office_location VARCHAR(100),
    approval_required BOOLEAN DEFAULT true,
    auto_approve_staff BOOLEAN DEFAULT false,
    auto_approve_recurring BOOLEAN DEFAULT false,
    max_visitors_per_day INTEGER DEFAULT 20,
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visitors table
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    cnic VARCHAR(255), -- Encrypted
    company VARCHAR(255),
    designation VARCHAR(100),
    photo_url VARCHAR(500),
    vehicle_number VARCHAR(20),
    permanent_visitor BOOLEAN DEFAULT false,
    blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    blacklisted_at TIMESTAMP,
    blacklisted_by UUID REFERENCES users(id),
    visit_count INTEGER DEFAULT 0,
    last_visit_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visits table
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
    qr_code TEXT,
    qr_code_data JSONB,
    pass_generated_at TIMESTAMP,
    pass_expires_at TIMESTAMP,
    temperature_reading DECIMAL(4,1),
    security_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Visit approvals table
CREATE TABLE visit_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID REFERENCES visits(id) NOT NULL,
    approver_id UUID REFERENCES users(id) NOT NULL,
    approval_level INTEGER NOT NULL DEFAULT 1,
    status approval_status NOT NULL,
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recurring visits table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES users(id) NOT NULL,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[],
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
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
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly reports table
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

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- FOREIGN KEY CONSTRAINTS
-- =====================================================

ALTER TABLE users 
    ADD CONSTRAINT fk_users_executive 
    FOREIGN KEY (executive_id) REFERENCES executives(id);

ALTER TABLE users 
    ADD CONSTRAINT fk_users_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_executive ON users(executive_id);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Executives indexes
CREATE INDEX idx_executives_user ON executives(user_id);
CREATE INDEX idx_executives_position ON executives(position);
CREATE INDEX idx_executives_active ON executives(is_active) WHERE is_active = true;

-- Visitors indexes
CREATE INDEX idx_visitors_phone ON visitors(phone);
CREATE INDEX idx_visitors_email ON visitors(email);
CREATE INDEX idx_visitors_cnic ON visitors(cnic);
CREATE INDEX idx_visitors_company ON visitors(company);
CREATE INDEX idx_visitors_blacklisted ON visitors(blacklisted) WHERE blacklisted = true;
CREATE INDEX idx_visitors_name_trgm ON visitors USING gin(full_name gin_trgm_ops);

-- Visits indexes
CREATE INDEX idx_visits_visitor ON visits(visitor_id);
CREATE INDEX idx_visits_executive ON visits(executive_id);
CREATE INDEX idx_visits_host_staff ON visits(host_staff_id);
CREATE INDEX idx_visits_scheduled_date ON visits(scheduled_date);
CREATE INDEX idx_visits_status ON visits(visit_status);
CREATE INDEX idx_visits_approval ON visits(approval_status);
CREATE INDEX idx_visits_code ON visits(visit_code);
CREATE INDEX idx_visits_type ON visits(visit_type);
CREATE INDEX idx_visits_checkin ON visits(actual_checkin_time);
CREATE INDEX idx_visits_created ON visits(created_at);

-- Visit approvals indexes
CREATE INDEX idx_visit_approvals_visit ON visit_approvals(visit_id);
CREATE INDEX idx_visit_approvals_approver ON visit_approvals(approver_id);
CREATE INDEX idx_visit_approvals_status ON visit_approvals(status);

-- Recurring visits indexes
CREATE INDEX idx_recurring_visitor ON recurring_visits(visitor_id);
CREATE INDEX idx_recurring_executive ON recurring_visits(executive_id);
CREATE INDEX idx_recurring_active ON recurring_visits(is_active) WHERE is_active = true;

-- Notifications indexes
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(read, recipient_id) WHERE read = false;
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Weekly reports indexes
CREATE INDEX idx_weekly_reports_week ON weekly_reports(report_week);
CREATE INDEX idx_weekly_reports_executive ON weekly_reports(executive_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate visit code
CREATE OR REPLACE FUNCTION generate_visit_code()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
    next_number INTEGER;
BEGIN
    year_part := TO_CHAR(NEW.scheduled_date, 'YYYY');
    
    -- Get the highest sequence number for the year from all visit codes
    SELECT COALESCE(MAX(CAST(SUBSTRING(visit_code FROM '\\d{6}$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM visits
    WHERE visit_code LIKE 'GC-' || year_part || '-%';
    
    -- Format as 6-digit padded number
    sequence_part := LPAD(next_number::TEXT, 6, '0');
    
    -- Standard format: GC-YYYY-XXXXXX (no type prefix)
    NEW.visit_code := 'GC-' || year_part || '-' || sequence_part;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update visitor statistics
CREATE OR REPLACE FUNCTION update_visitor_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.visit_status = 'checked_out' AND OLD.visit_status != 'checked_out' THEN
        UPDATE visitors
        SET 
            visit_count = visit_count + 1,
            last_visit_date = NEW.actual_checkout_time
        WHERE id = NEW.visitor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executives_updated_at 
    BEFORE UPDATE ON executives 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitors_updated_at 
    BEFORE UPDATE ON visitors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at 
    BEFORE UPDATE ON visits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_visits_updated_at 
    BEFORE UPDATE ON recurring_visits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Visit code generation trigger
CREATE TRIGGER generate_visit_code_trigger
    BEFORE INSERT ON visits
    FOR EACH ROW
    WHEN (NEW.visit_code IS NULL)
    EXECUTE FUNCTION generate_visit_code();

-- Visitor stats update trigger
CREATE TRIGGER update_visitor_stats_trigger
    AFTER UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_visitor_stats();

-- =====================================================
-- VIEWS
-- =====================================================

-- Today's visitors view
CREATE OR REPLACE VIEW todays_visitors AS
SELECT 
    v.id,
    v.visit_code,
    vis.full_name AS visitor_name,
    vis.company,
    vis.phone,
    vis.photo_url,
    e.title AS executive_title,
    u.full_name AS executive_name,
    v.purpose_of_visit,
    v.scheduled_time_from,
    v.scheduled_time_to,
    v.visit_status,
    v.approval_status,
    v.actual_checkin_time,
    v.entry_gate
FROM visits v
JOIN visitors vis ON v.visitor_id = vis.id
JOIN executives e ON v.executive_id = e.id
JOIN users u ON e.user_id = u.id
WHERE v.scheduled_date = CURRENT_DATE
ORDER BY v.scheduled_time_from;

-- Pending approvals view
CREATE OR REPLACE VIEW pending_approvals AS
SELECT 
    v.id,
    v.visit_code,
    vis.full_name AS visitor_name,
    vis.company,
    vis.phone,
    e.title AS executive_title,
    u.full_name AS executive_name,
    u.id AS executive_user_id,
    v.purpose_of_visit,
    v.scheduled_date,
    v.scheduled_time_from,
    v.visit_type,
    v.created_at
FROM visits v
JOIN visitors vis ON v.visitor_id = vis.id
JOIN executives e ON v.executive_id = e.id
JOIN users u ON e.user_id = u.id
WHERE v.approval_status = 'pending'
ORDER BY v.scheduled_date, v.scheduled_time_from;

-- Visitor history view
CREATE OR REPLACE VIEW visitor_history AS
SELECT 
    vis.id AS visitor_id,
    vis.full_name AS visitor_name,
    vis.company,
    v.visit_code,
    v.scheduled_date,
    v.visit_status,
    v.actual_checkin_time,
    v.actual_checkout_time,
    e.title AS executive_title,
    u.full_name AS executive_name,
    v.purpose_of_visit,
    v.rating,
    v.feedback
FROM visitors vis
LEFT JOIN visits v ON vis.id = v.visitor_id
LEFT JOIN executives e ON v.executive_id = e.id
LEFT JOIN users u ON e.user_id = u.id
ORDER BY v.scheduled_date DESC;

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('qr_code_expiry_hours', '24', 'Default QR code expiry in hours'),
('max_visitors_per_day_default', '20', 'Default maximum visitors per executive per day'),
('approval_timeout_minutes', '30', 'Minutes before walk-in request times out'),
('working_hours_default', '{"start": "09:00", "end": "18:00"}', 'Default working hours');

-- Insert admin user
INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
('admin@grandcity.pk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYPq/gkmGru', 'System Administrator', 'admin', true);

-- =====================================================
-- ROW LEVEL SECURITY (Optional)
-- =====================================================

-- Enable RLS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE executives ENABLE ROW LEVEL SECURITY;

-- Policy: Executives can only see their own visits
CREATE POLICY executive_visits_policy ON visits
    FOR SELECT
    USING (
        executive_id IN (
            SELECT id FROM executives WHERE user_id = current_user_id()
        )
    );

-- Policy: Staff can see visits for assigned executives
CREATE POLICY staff_visits_policy ON visits
    FOR SELECT
    USING (
        executive_id IN (
            SELECT executive_id FROM users WHERE id = current_user_id()
        )
    );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'System users including executives, staff, guards, receptionists, and admins';
COMMENT ON TABLE executives IS 'Executive profiles with scheduling preferences';
COMMENT ON TABLE visitors IS 'Visitor information and history';
COMMENT ON TABLE visits IS 'Individual visit records with scheduling and check-in/out details';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all system actions';
COMMENT ON TABLE weekly_reports IS 'Pre-generated weekly compliance and analytics reports';

-- =====================================================
-- MAINTENANCE
-- =====================================================

-- Vacuum and analyze
VACUUM ANALYZE;

