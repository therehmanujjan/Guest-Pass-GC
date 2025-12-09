-- Fixed trigger function to properly extract sequence numbers
CREATE OR REPLACE FUNCTION generate_visit_code()
RETURNS TRIGGER AS $$
DECLARE
    year_part VARCHAR(4);
    sequence_part VARCHAR(6);
    next_number INTEGER;
    max_code TEXT;
BEGIN
    year_part := TO_CHAR(NEW.scheduled_date, 'YYYY');

    -- Get the highest visit code for the year
    SELECT visit_code INTO max_code
    FROM visits
    WHERE visit_code LIKE 'GC-' || year_part || '-%'
    ORDER BY visit_code DESC
    LIMIT 1;

    -- Extract the numeric part and increment
    IF max_code IS NOT NULL THEN
        -- Extract last 6 digits: GC-2025-000007 -> 000007 -> 7
        next_number := CAST(SUBSTRING(max_code FROM '\d{6}$') AS INTEGER) + 1;
    ELSE
        next_number := 1;
    END IF;

    -- Format as 6-digit padded number
    sequence_part := LPAD(next_number::TEXT, 6, '0');

    -- Standard format: GC-YYYY-XXXXXX
    NEW.visit_code := 'GC-' || year_part || '-' || sequence_part;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the trigger is attached
SELECT tgname, tgrelid::regclass, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'set_visit_code';
