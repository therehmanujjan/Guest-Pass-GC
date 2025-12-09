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
    if (tables.rows.length === 0) {
      console.log('  (No tables found - run setup-database.js first)');
    } else {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    console.log('');

    // Count records
    if (tables.rows.length > 0) {
      const counts = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM executives) as executives,
          (SELECT COUNT(*) FROM visitors) as visitors,
          (SELECT COUNT(*) FROM visits) as visits
      `);
      console.log('Record counts:');
      console.log(`  - Executives: ${counts.rows[0].executives}`);
      console.log(`  - Visitors: ${counts.rows[0].visitors}`);
      console.log(`  - Visits: ${counts.rows[0].visits}`);
      console.log('');
    }

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
