-- Update the visit code generation trigger
-- Run this SQL to fix the visit code generation

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

-- Verify the trigger exists and is active
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'generate_visit_code_trigger';
