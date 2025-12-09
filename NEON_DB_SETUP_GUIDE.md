# Neon Database Setup Guide
## Grand City HQ - Guest Pass Management System

This guide will walk you through setting up Neon PostgreSQL database for the Guest Pass Management System.

---

## Table of Contents
1. [Create Neon Account & Project](#1-create-neon-account--project)
2. [Get Database Connection Details](#2-get-database-connection-details)
3. [Install Required Packages](#3-install-required-packages)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Run Database Schema](#5-run-database-schema)
6. [Update Server Configuration](#6-update-server-configuration)
7. [Test Database Connection](#7-test-database-connection)

---

## 1. Create Neon Account & Project

### Step 1.1: Sign Up
1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign Up"** 
3. Sign up with GitHub, Google, or Email
4. Verify your email (if required)

### Step 1.2: Create a New Project
1. After logging in, click **"Create a project"**
2. Configure your project:
   - **Project Name**: `grand-city-guest-pass`
   - **Region**: Choose closest to your location (e.g., `US East (Ohio)`, `EU (Frankfurt)`, `Asia (Singapore)`)
   - **PostgreSQL Version**: Select `15` or latest
   - **Compute Size**: Start with **Free tier** (0.25 vCPU)
3. Click **"Create Project"**

---

## 2. Get Database Connection Details

### Step 2.1: Get Connection String
After project creation, you'll see the **Connection Details** page:

1. **Connection String** - Copy this, it looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

2. You'll also see individual details:
   - **Host**: `ep-xxx-xxx.region.aws.neon.tech`
   - **Database**: `neondb` (default)
   - **User**: `username`
   - **Password**: `your-password`
   - **Port**: `5432`

3. **IMPORTANT**: Save these credentials securely - the password is only shown once!

### Step 2.2: Connection String Format
Your connection string format for Node.js (using `pg` library):
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

---

## 3. Install Required Packages

Open terminal in your project root and run:

```powershell
# Install PostgreSQL client for Node.js
npm install pg

# Install dotenv for environment variables
npm install dotenv

# Install connection pool (optional but recommended)
npm install pg-pool
```

---

## 4. Configure Environment Variables

### Step 4.1: Create `.env` file
Create a `.env` file in your project root:

```env
# Neon PostgreSQL Database Configuration
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require

# Individual connection details (alternative method)
DB_HOST=ep-xxx-xxx.region.aws.neon.tech
DB_PORT=5432
DB_NAME=neondb
DB_USER=username
DB_PASSWORD=your-password
DB_SSL=true

# Server Configuration
PORT=3000
NODE_ENV=development

# Application Settings
SESSION_SECRET=your-secret-key-here-change-this
JWT_SECRET=your-jwt-secret-here-change-this
```

### Step 4.2: Update `.gitignore`
Make sure `.env` is in your `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.staging

# Node modules
node_modules/

# Logs
npm-debug.log*
logs/
*.log
```

---

## 5. Run Database Schema

### Step 5.1: Connect to Neon via SQL Editor
1. Go to your Neon dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Copy the contents of `database_schema.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** to execute the schema

### Step 5.2: Verify Tables Created
Run this query to check if tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see tables like:
- `users`
- `visitors`
- `visits`
- `executives`
- `audit_logs`
- etc.

### Step 5.3: Alternative - Run Schema via Node.js
Create a file `scripts/setup-database.js`:

```javascript
require('dotenv').config();
const fs = require('fs');
const { Client } = require('pg');

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to Neon database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Reading schema file...');
    const schema = fs.readFileSync('./database_schema.sql', 'utf8');

    console.log('Executing schema...');
    await client.query(schema);
    console.log('✓ Database schema created successfully!');

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

setupDatabase();
```

Run it:
```powershell
node scripts/setup-database.js
```

---

## 6. Update Server Configuration

### Step 6.1: Create Database Connection Module
Create `config/database.js`:

```javascript
require('dotenv').config();
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection not available
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✓ Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

### Step 6.2: Update `server.js`
Update your server file to use Neon:

```javascript
require('dotenv').config();
const express = require('express');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Test endpoint
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

// === API ENDPOINTS ===

// Get all visits
app.get('/api/visits', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, 
             vis.name as visitor_name,
             vis.company as visitor_company,
             e.name as executive_name
      FROM visits v
      LEFT JOIN visitors vis ON v.visitor_id = vis.id
      LEFT JOIN executives e ON v.executive_id = e.id
      ORDER BY v.date DESC, v.time_from DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

// Create new visit
app.post('/api/visits', async (req, res) => {
  const { visitor, executive_id, date, time_from, time_to, purpose } = req.body;
  
  try {
    // Start transaction
    await db.query('BEGIN');

    // Insert or get visitor
    let visitorResult = await db.query(
      'SELECT id FROM visitors WHERE phone = $1',
      [visitor.phone]
    );

    let visitorId;
    if (visitorResult.rows.length > 0) {
      visitorId = visitorResult.rows[0].id;
      // Update visitor info
      await db.query(
        'UPDATE visitors SET name = $1, email = $2, company = $3 WHERE id = $4',
        [visitor.name, visitor.email, visitor.company, visitorId]
      );
    } else {
      // Insert new visitor
      const newVisitor = await db.query(
        'INSERT INTO visitors (name, email, phone, company) VALUES ($1, $2, $3, $4) RETURNING id',
        [visitor.name, visitor.email, visitor.phone, visitor.company]
      );
      visitorId = newVisitor.rows[0].id;
    }

    // Generate visit code
    const code = 'GC' + Date.now().toString().slice(-8);

    // Insert visit
    const visitResult = await db.query(
      `INSERT INTO visits (code, visitor_id, executive_id, date, time_from, time_to, purpose, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
       RETURNING *`,
      [code, visitorId, executive_id, date, time_from, time_to, purpose]
    );

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      visit: visitResult.rows[0]
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating visit:', error);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

// Validate QR code at gate
app.post('/api/visits/validate', async (req, res) => {
  const { code } = req.body;

  try {
    const result = await db.query(`
      SELECT v.*, 
             vis.name as visitor_name,
             vis.phone as visitor_phone,
             vis.company as visitor_company,
             e.name as executive_name,
             e.department as executive_department
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      JOIN executives e ON v.executive_id = e.id
      WHERE v.code = $1
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
       SET status = 'checked_in', 
           actual_checkin = NOW()
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

// Get executives
app.get('/api/executives', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM executives ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching executives:', error);
    res.status(500).json({ error: 'Failed to fetch executives' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await db.pool.end();
  process.exit(0);
});
```

---

## 7. Test Database Connection

### Step 7.1: Test Connection Script
Create `scripts/test-connection.js`:

```javascript
require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Testing Neon database connection...\n');
    
    await client.connect();
    console.log('✓ Connected to database\n');

    // Test query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL Version:');
    console.log(result.rows[0].version);
    console.log('');

    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables in database:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');

    console.log('✓ Connection test successful!');

  } catch (error) {
    console.error('✗ Connection test failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
```

Run it:
```powershell
node scripts/test-connection.js
```

### Step 7.2: Start Server & Test
```powershell
# Start the server
node server.js

# In another terminal, test the health endpoint
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-12-09T10:30:00.000Z"
}
```

---

## 8. Update Frontend to Use API

### Step 8.1: Modify `index.html`
Replace localStorage functions with API calls:

```javascript
// OLD (localStorage)
const saveVisit = (visit) => {
    const visits = getVisits();
    visits.push(visit);
    localStorage.setItem('visits', JSON.stringify(visits));
};

// NEW (API)
const saveVisit = async (visit) => {
    try {
        const response = await fetch('/api/visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(visit)
        });
        
        if (!response.ok) throw new Error('Failed to save visit');
        
        const result = await response.json();
        return result.visit;
    } catch (error) {
        console.error('Error saving visit:', error);
        alert('Unable to save visit. Please try again.');
        throw error;
    }
};

// OLD (localStorage)
const getVisits = () => {
    return JSON.parse(localStorage.getItem('visits') || '[]');
};

// NEW (API)
const getVisits = async () => {
    try {
        const response = await fetch('/api/visits');
        if (!response.ok) throw new Error('Failed to fetch visits');
        return await response.json();
    } catch (error) {
        console.error('Error fetching visits:', error);
        return [];
    }
};

// Validate QR code
const validateVisit = async (code) => {
    try {
        const response = await fetch('/api/visits/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error validating visit:', error);
        return { valid: false, error: 'Validation failed' };
    }
};
```

---

## 9. Neon Dashboard Features

### Monitoring
- **Metrics**: View CPU, memory, and connection usage
- **Queries**: Monitor slow queries and performance
- **Logs**: Access PostgreSQL logs

### Branches (Git-like for Database)
Neon supports database branches:
- Create dev/staging branches
- Test schema changes
- Merge changes to main

### Backups
- Automatic point-in-time recovery
- Restore to any point in the last 7 days (Free tier)
- 30+ days for paid plans

### Scaling
- Autoscaling: Database scales up during high load
- Autosuspend: Database pauses when inactive (saves costs)

---

## 10. Important Notes

### Security Best Practices
1. ✓ Never commit `.env` to git
2. ✓ Always use SSL connections (`sslmode=require`)
3. ✓ Use environment variables for credentials
4. ✓ Implement proper authentication/authorization
5. ✓ Use prepared statements (prevents SQL injection)

### Connection Pooling
- Use `pg-pool` for better performance
- Set appropriate pool size (max: 20 for free tier)
- Monitor active connections in Neon dashboard

### Free Tier Limits
- 0.25 vCPU
- 1 GB storage
- 100 hours compute per month
- Autosuspends after 5 minutes of inactivity

### Upgrade When Needed
Consider paid plan if you need:
- More compute hours
- Larger storage
- Multiple projects
- Longer backup retention

---

## 11. Troubleshooting

### Connection Timeout
```
Error: Connection timeout
```
**Solution**: Check if SSL is enabled in connection string: `?sslmode=require`

### Too Many Connections
```
Error: sorry, too many clients already
```
**Solution**: Reduce pool size in `config/database.js` or upgrade Neon plan

### SSL Error
```
Error: self signed certificate
```
**Solution**: Set `rejectUnauthorized: false` in SSL config

### Schema Not Found
```
Error: relation "visits" does not exist
```
**Solution**: Run `database_schema.sql` in Neon SQL Editor

---

## 12. Next Steps

1. ✓ Test all API endpoints
2. ✓ Update frontend to use APIs
3. ✓ Implement authentication
4. ✓ Add error handling
5. ✓ Set up staging environment
6. ✓ Configure production environment
7. ✓ Monitor performance in Neon dashboard

---

## Support & Resources

- **Neon Docs**: https://neon.tech/docs
- **Node.js pg Library**: https://node-postgres.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs

---

**Setup Complete!** 🎉

Your Guest Pass Management System is now connected to Neon PostgreSQL database with multi-device synchronization enabled.
