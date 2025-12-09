require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkCodes() {
  try {
    const result = await pool.query(`
      SELECT visit_code, scheduled_date, created_at 
      FROM visits 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\nExisting visit codes:');
    result.rows.forEach(row => {
      console.log(`  ${row.visit_code} - ${row.scheduled_date} - ${row.created_at}`);
    });
    
    // Check trigger function
    const triggerCheck = await pool.query(`
      SELECT prosrc FROM pg_proc WHERE proname = 'generate_visit_code'
    `);
    
    console.log('\n\nCurrent trigger function:\n');
    console.log(triggerCheck.rows[0]?.prosrc || 'Trigger not found');
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

checkCodes();
