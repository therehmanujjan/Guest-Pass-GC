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
    console.log('✓ Connected successfully!\n');

    console.log('Reading schema file...');
    const schema = fs.readFileSync('./database_schema.sql', 'utf8');

    console.log('Executing schema...');
    await client.query(schema);
    console.log('✓ Database schema created successfully!\n');

    // Insert sample data
    console.log('Inserting sample executives...');
    await client.query(`
      INSERT INTO executives (name, position, department, email, phone) VALUES
      ('John Smith', 'md_partner', 'Management', 'john.smith@grandcity.com', '+92-300-1234567'),
      ('Sarah Johnson', 'ceo', 'Executive', 'sarah.johnson@grandcity.com', '+92-300-2345678'),
      ('Michael Chen', 'director_operations', 'Operations', 'michael.chen@grandcity.com', '+92-300-3456789')
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✓ Sample executives added!\n');

    console.log('Database setup completed successfully! 🎉');

  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Connection closed.');
  }
}

setupDatabase();
