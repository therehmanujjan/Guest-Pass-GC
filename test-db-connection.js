require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    
    const result = await client.query('SELECT NOW()');
    console.log('✓ Query test successful:', result.rows[0]);
    
    const visitsResult = await client.query('SELECT COUNT(*) FROM visits');
    console.log('✓ Visits table accessible, count:', visitsResult.rows[0].count);
    
    client.release();
    await pool.end();
    console.log('\n✓ All tests passed');
    process.exit(0);
  } catch (err) {
    console.error('✗ Connection error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

testConnection();
