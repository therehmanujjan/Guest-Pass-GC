-- Create visitors table for shared visitor data
CREATE TABLE visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    id_number TEXT,
    id_type TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by TEXT,
    updated_by TEXT
);

-- Create visits table for shared visit records
CREATE TABLE visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    host_name TEXT NOT NULL,
    host_department TEXT,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out', 'cancelled')),
    qr_code TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by TEXT,
    updated_by TEXT
);

-- Create executives table for shared host information
CREATE TABLE executives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    position TEXT,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by TEXT,
    updated_by TEXT
);

-- Create system settings table for shared configuration
CREATE TABLE system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_by TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for visitors table (allow all authenticated users to read/write)
CREATE POLICY "Allow all authenticated users to read visitors" ON visitors
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow all authenticated users to insert visitors" ON visitors
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update visitors" ON visitors
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to delete visitors" ON visitors
    FOR DELETE TO authenticated
    USING (true);

-- Create policies for visits table
CREATE POLICY "Allow all authenticated users to read visits" ON visits
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow all authenticated users to insert visits" ON visits
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update visits" ON visits
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to delete visits" ON visits
    FOR DELETE TO authenticated
    USING (true);

-- Create policies for executives table
CREATE POLICY "Allow all authenticated users to read executives" ON executives
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow all authenticated users to insert executives" ON executives
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update executives" ON executives
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to delete executives" ON executives
    FOR DELETE TO authenticated
    USING (true);

-- Create policies for system_settings table
CREATE POLICY "Allow all authenticated users to read settings" ON system_settings
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow all authenticated users to update settings" ON system_settings
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON visitors TO authenticated;
GRANT ALL PRIVILEGES ON visits TO authenticated;
GRANT ALL PRIVILEGES ON executives TO authenticated;
GRANT ALL PRIVILEGES ON system_settings TO authenticated;

-- Grant permissions to anon users (for basic access)
GRANT SELECT ON visitors TO anon;
GRANT SELECT ON visits TO anon;
GRANT SELECT ON executives TO anon;
GRANT SELECT ON system_settings TO anon;

-- Create indexes for better performance
CREATE INDEX idx_visitors_name ON visitors(name);
CREATE INDEX idx_visitors_email ON visitors(email);
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_check_in_time ON visits(check_in_time);
CREATE INDEX idx_executives_name ON executives(name);
CREATE INDEX idx_executives_department ON executives(department);

-- Insert default executives data
INSERT INTO executives (name, department, position, email, phone) VALUES
('John Smith', 'Management', 'CEO', 'john.smith@company.com', '555-0101'),
('Sarah Johnson', 'Operations', 'COO', 'sarah.johnson@company.com', '555-0102'),
('Michael Chen', 'Finance', 'CFO', 'michael.chen@company.com', '555-0103'),
('Emily Davis', 'Technology', 'CTO', 'emily.davis@company.com', '555-0104'),
('Robert Wilson', 'Marketing', 'CMO', 'robert.wilson@company.com', '555-0105'),
('Lisa Brown', 'Human Resources', 'HR Director', 'lisa.brown@company.com', '555-0106'),
('David Martinez', 'Sales', 'Sales Director', 'david.martinez@company.com', '555-0107'),
('Jennifer Lee', 'Legal', 'Legal Director', 'jennifer.lee@company.com', '555-0108'),
('William Taylor', 'Procurement', 'Procurement Manager', 'william.taylor@company.com', '555-0109'),
('Amanda White', 'Quality Assurance', 'QA Manager', 'amanda.white@company.com', '555-0110');

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('company_name', 'Guest Pass Management System', 'Company name displayed in the system'),
('require_photo', 'true', 'Whether visitor photos are required'),
('auto_checkout_time', '18:00', 'Automatic checkout time for visitors'),
('qr_code_enabled', 'true', 'Whether QR code generation is enabled'),
('max_visit_duration', '8', 'Maximum allowed visit duration in hours');

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at updates
CREATE TRIGGER update_visitors_updated_at BEFORE UPDATE ON visitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executives_updated_at BEFORE UPDATE ON executives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();