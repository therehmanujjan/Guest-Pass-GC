-- Move guestpass tables to public schema for Vercel deployment

-- Create tables in public schema if they don't exist
CREATE TABLE IF NOT EXISTS visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    photo_url TEXT,
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'system',
    updated_by TEXT DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS executives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    department TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id UUID NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
    executive_id UUID REFERENCES executives(id) ON DELETE SET NULL,
    purpose TEXT NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'checked_out')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for visitors
CREATE POLICY "Allow public read access" ON visitors FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON visitors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON visitors FOR DELETE USING (true);

-- Create policies for executives
CREATE POLICY "Allow public read access" ON executives FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON executives FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON executives FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON executives FOR DELETE USING (true);

-- Create policies for visits
CREATE POLICY "Allow public read access" ON visits FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON visits FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON visits FOR DELETE USING (true);

-- Create policies for system_settings
CREATE POLICY "Allow public read access" ON system_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON system_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON system_settings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON system_settings FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON visitors TO anon, authenticated;
GRANT ALL ON executives TO anon, authenticated;
GRANT ALL ON visits TO anon, authenticated;
GRANT ALL ON system_settings TO anon, authenticated;

-- Insert default system settings
INSERT INTO system_settings (key, value) VALUES 
('organization_name', 'Grand City'),
('max_visit_duration', '8'),
('require_photo', 'false')
ON CONFLICT (key) DO NOTHING;