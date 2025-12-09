require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateTrigger() {
  try {
    const sql = fs.readFileSync('./fix-trigger.sql', 'utf8');
    await pool.query(sql);
    
    console.log('✓ Trigger function updated successfully');
    
    // Test the trigger logic manually
    const testResult = await pool.query(`
      SELECT visit_code 
      FROM visits 
      WHERE visit_code LIKE 'GC-2025-%'
      ORDER BY visit_code DESC 
      LIMIT 1
    `);
    
    if (testResult.rows.length > 0) {
      const lastCode = testResult.rows[0].visit_code;
      const lastNumber = parseInt(lastCode.substring(8)); // Extract from position 8 onwards
      console.log(`\nLast code: ${lastCode}`);
      console.log(`Extracted number: ${lastNumber}`);
      console.log(`Next code should be: GC-2025-${String(lastNumber + 1).padStart(6, '0')}`);
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

updateTrigger();
