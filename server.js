require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

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

// === AUTHENTICATION MIDDLEWARE ===

// Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // Add user info to request
    next();
  });
};

// === API ENDPOINTS ===

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Get user from database
    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.password_hash, u.is_active,
              u.failed_login_attempts, u.account_locked_until,
              e.id as executive_id, e.position
       FROM users u
       LEFT JOIN executives e ON u.id = e.user_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Check if account is locked
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      return res.status(403).json({ 
        error: 'Account is locked. Please try again later.',
        lockedUntil: user.account_locked_until
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Password not set for this account' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;
      const lockAccount = failedAttempts >= 5;
      
      if (lockAccount) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await db.query(
          `UPDATE users 
           SET failed_login_attempts = $1, account_locked_until = $2 
           WHERE id = $3`,
          [failedAttempts, lockUntil, user.id]
        );
        return res.status(403).json({ 
          error: 'Account locked due to multiple failed login attempts',
          lockedUntil: lockUntil
        });
      } else {
        await db.query(
          'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
          [failedAttempts, user.id]
        );
        return res.status(401).json({ 
          error: 'Invalid email or password',
          attemptsRemaining: 5 - failedAttempts
        });
      }
    }

    // Successful login - reset failed attempts and update last login
    await db.query(
      `UPDATE users 
       SET failed_login_attempts = 0, 
           account_locked_until = NULL, 
           last_login_at = NOW() 
       WHERE id = $1`,
      [user.id]
    );

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      executiveId: user.executive_id,
      position: user.position
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        executiveId: user.executive_id,
        position: user.position
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Logout endpoint (client-side token removal, but we can log it)
app.post('/api/logout', authenticateToken, async (req, res) => {
  // In a more advanced implementation, you could invalidate the token in a blacklist
  res.json({ success: true, message: 'Logged out successfully' });
});

// Verify token endpoint (check if current token is valid)
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
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
app.get('/api/visits', authenticateToken, async (req, res) => {
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

// Get executives (public endpoint - needed for login screen)
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
app.get('/api/visits/generate-code', authenticateToken, async (req, res) => {
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
app.post('/api/visits', authenticateToken, async (req, res) => {
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
app.put('/api/visits/:id', authenticateToken, async (req, res) => {
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
app.post('/api/visits/:id/checkin', authenticateToken, async (req, res) => {
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
app.post('/api/visits/:id/checkout', authenticateToken, async (req, res) => {
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