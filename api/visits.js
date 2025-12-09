const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all visits
      const result = await pool.query(`
        SELECT v.id,
               v.visit_code as code,
               v.visit_type as type,
               TO_CHAR(v.scheduled_date, 'YYYY-MM-DD') as date,
               v.scheduled_time_from as time_from,
               v.scheduled_time_to as time_to,
               v.purpose_of_visit as purpose,
               v.visit_status as status,
               v.approval_status as approval,
               v.actual_checkin_time as actual_checkin,
               v.actual_checkout_time as actual_checkout,
               v.created_at,
               v.executive_id,
               vis.full_name as visitor_name,
               vis.email as visitor_email,
               vis.phone as visitor_phone,
               vis.company as visitor_company,
               u.full_name as executive_name,
               u.department as executive_department
        FROM visits v
        LEFT JOIN visitors vis ON v.visitor_id = vis.id
        LEFT JOIN executives e ON v.executive_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
        ORDER BY v.scheduled_date DESC, v.scheduled_time_from DESC
      `);
      
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      // Create new visit
      const { visitor, executive_id, date, time_from, time_to, purpose, visit_type = 'scheduled' } = req.body;

      // Validate and sanitize executive_id (convert empty string to null)
      const sanitizedExecutiveId = executive_id && executive_id.trim() !== '' ? executive_id : null;

      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Check if visitor exists
        let visitorResult = await client.query(
          'SELECT id FROM visitors WHERE email = $1',
          [visitor.email]
        );

        let visitorId;
        if (visitorResult.rows.length > 0) {
          visitorId = visitorResult.rows[0].id;
          // Update visitor info
          await client.query(
            `UPDATE visitors SET full_name = $1, phone = $2, company = $3 WHERE id = $4`,
            [visitor.name, visitor.phone, visitor.company, visitorId]
          );
        } else {
          // Create new visitor
          visitorResult = await client.query(
            `INSERT INTO visitors (full_name, email, phone, company) VALUES ($1, $2, $3, $4) RETURNING id`,
            [visitor.name, visitor.email, visitor.phone, visitor.company]
          );
          visitorId = visitorResult.rows[0].id;
        }

        // Generate visit code
        const counterResult = await client.query(
          'SELECT COALESCE(MAX(CAST(SUBSTRING(visit_code FROM 9) AS INTEGER)), 0) + 1 as next_counter FROM visits WHERE visit_code LIKE $1',
          ['GC-2025-%']
        );
        const counter = counterResult.rows[0].next_counter;
        const visitCode = `GC-2025-${String(counter).padStart(6, '0')}`;

        // Create visit
        const visitResult = await client.query(
          `INSERT INTO visits (visit_code, visitor_id, executive_id, scheduled_date, scheduled_time_from, scheduled_time_to, purpose_of_visit, visit_type, visit_status, approval_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [visitCode, visitorId, sanitizedExecutiveId, date, time_from, time_to, purpose, visit_type, 'scheduled', 'pending']
        );

        await client.query('COMMIT');
        return res.status(201).json(visitResult.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
