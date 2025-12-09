require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent caching of HTML files to avoid serving stale code
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

// === API ENDPOINTS ===

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Get all visits
app.get('/api/visits', async (req, res) => {
  try {
    const result = await db.query(`
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
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// Get executives
app.get('/api/executives', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.id, u.full_name as name, e.position, u.email, u.department
      FROM executives e
      JOIN users u ON e.user_id = u.id
      WHERE e.is_active = true AND u.is_active = true
      ORDER BY u.full_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching executives:', error);
    res.status(500).json({ error: 'Failed to fetch executives' });
  }
});

// Generate next visit code
app.get('/api/visits/generate-code', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    
    // Get the highest sequence number for current year
    const result = await db.query(`
      SELECT visit_code 
      FROM visits 
      WHERE visit_code LIKE $1
      ORDER BY visit_code DESC 
      LIMIT 1
    `, [`GC-${year}-%`]);
    
    let nextNumber = 1;
    
    if (result.rows.length > 0) {
      // Extract number from code like "GC-2025-000123" or "GC-2025-WI000123"
      const lastCode = result.rows[0].visit_code;
      const match = lastCode.match(/(\d{6})$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    // Format: GC-YYYY-XXXXXX
    const code = `GC-${year}-${String(nextNumber).padStart(6, '0')}`;
    
    console.log('Generated visit code:', code);
    res.json({ code });
  } catch (error) {
    console.error('Error generating visit code:', error);
    res.status(500).json({ error: 'Failed to generate visit code' });
  }
});

// Create new visit
app.post('/api/visits', async (req, res) => {
  let { visitor, executive_id, date, time_from, time_to, purpose, visit_type = 'scheduled' } = req.body;
  
  console.log('Creating visit with data:', { visitor, executive_id, date, time_from, time_to, purpose, visit_type });
  
  try {
    // Start transaction
    await db.query('BEGIN');

    // If executive_id is a number (legacy ID), get the first available executive UUID
    if (typeof executive_id === 'number' || !executive_id.includes('-')) {
      const execResult = await db.query('SELECT id FROM executives LIMIT 1');
      if (execResult.rows.length > 0) {
        executive_id = execResult.rows[0].id;
        console.log('Converted integer executive_id to UUID:', executive_id);
      } else {
        throw new Error('No executives found in database. Please add executives first.');
      }
    }

    // Insert or get visitor
    let visitorResult = await db.query(
      'SELECT id FROM visitors WHERE phone = $1',
      [visitor.phone]
    );

    let visitorId;
    if (visitorResult.rows.length > 0) {
      visitorId = visitorResult.rows[0].id;
      console.log('Found existing visitor:', visitorId);
      // Update visitor info
      await db.query(
        'UPDATE visitors SET full_name = $1, email = $2, company = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [visitor.name, visitor.email, visitor.company, visitorId]
      );
    } else {
      // Insert new visitor
      const newVisitor = await db.query(
        'INSERT INTO visitors (full_name, email, phone, company) VALUES ($1, $2, $3, $4) RETURNING id',
        [visitor.name, visitor.email, visitor.phone, visitor.company]
      );
      visitorId = newVisitor.rows[0].id;
      console.log('Created new visitor:', visitorId);
    }

    // All visits require approval (including walk-ins)
    const approvalStatus = 'pending';

    console.log('Inserting visit with type:', visit_type, 'approval:', approvalStatus);

    // Insert visit without code - let database trigger generate it
    const visitResult = await db.query(
      `INSERT INTO visits (visitor_id, executive_id, scheduled_date, scheduled_time_from, scheduled_time_to, purpose_of_visit, visit_type, visit_status, approval_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled', $8)
       RETURNING *`,
      [visitorId, executive_id, date, time_from, time_to, purpose, visit_type, approvalStatus]
    );

    await db.query('COMMIT');

    console.log('Visit created successfully:', visitResult.rows[0].id);
    console.log('Visit code from insert:', visitResult.rows[0].visit_code);

    // Get complete visit info
    const completeVisit = await db.query(`
      SELECT v.*, 
             vis.full_name as visitor_name,
             vis.email as visitor_email,
             vis.phone as visitor_phone,
             vis.company as visitor_company,
             u.full_name as executive_name,
             u.department as executive_department
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      JOIN executives e ON v.executive_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE v.id = $1
    `, [visitResult.rows[0].id]);

    console.log('Visit code from query:', completeVisit.rows[0].visit_code);

    res.status(201).json({
      success: true,
      visit: completeVisit.rows[0]
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating visit:', error);
    res.status(500).json({ error: 'Failed to create visit', details: error.message });
  }
});

// Update visit (for approvals, status changes, etc.)
app.put('/api/visits/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Build dynamic update query based on provided fields
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.approval !== undefined) {
      fields.push(`approval_status = $${paramCount++}`);
      values.push(updates.approval);
    }

    if (updates.approvedAt !== undefined) {
      fields.push(`approved_at = $${paramCount++}`);
      values.push(updates.approvedAt);
    }

    if (updates.status !== undefined) {
      fields.push(`visit_status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (updates.rejection_reason !== undefined) {
      fields.push(`rejection_reason = $${paramCount++}`);
      values.push(updates.rejection_reason);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add updated_at timestamp
    fields.push(`updated_at = NOW()`);
    values.push(id); // Add ID as the last parameter

    const query = `
      UPDATE visits 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json({ success: true, visit: result.rows[0] });
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({ error: 'Update failed', details: error.message });
  }
});

// Validate QR code at gate
app.post('/api/visits/validate', async (req, res) => {
  const { code } = req.body;

  try {
    const result = await db.query(`
      SELECT v.id,
             v.visit_code as code,
             v.scheduled_date as date,
             v.scheduled_time_from as time_from,
             v.scheduled_time_to as time_to,
             v.purpose_of_visit as purpose,
             v.visit_status as status,
             v.actual_checkin_time as actual_checkin,
             v.executive_id,
             vis.full_name as visitor_name,
             vis.phone as visitor_phone,
             vis.company as visitor_company,
             vis.email as visitor_email,
             u.full_name as executive_name,
             u.department as executive_department
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      JOIN executives e ON v.executive_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE v.visit_code = $1
    `, [code]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Visit not found' 
      });
    }

    const visit = result.rows[0];
    const visitDate = new Date(visit.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (visitDate < today) {
      return res.json({ 
        valid: false, 
        error: 'This pass has expired',
        visit 
      });
    }

    if (visit.status === 'cancelled') {
      return res.json({ 
        valid: false, 
        error: 'This pass has been cancelled',
        visit 
      });
    }

    res.json({ 
      valid: true, 
      visit 
    });
  } catch (error) {
    console.error('Error validating visit:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Check-in visitor
app.post('/api/visits/:id/checkin', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE visits 
       SET visit_status = 'checked_in', 
           actual_checkin_time = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json({ success: true, visit: result.rows[0] });
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// Check-out visitor
app.post('/api/visits/:id/checkout', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE visits 
       SET visit_status = 'checked_out', 
           actual_checkout_time = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    res.json({ success: true, visit: result.rows[0] });
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// Serve static files and main HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Grand City Guest Pass System`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await db.pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await db.pool.end();
  process.exit(0);
});