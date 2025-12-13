require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../config/database');

const SALT_ROUNDS = 12;

// Password mapping for all users
const userPasswords = {
  // Executives - using actual email addresses from database
  'khalid@grandcity.pk': 'ceo123',
  'salman@grandcity.pk': 'md123',
  'rehan@grandcity.pk': 'chair123',
  'shahnawaz@grandcity.pk': 'ops123',
  'aslam@grandcity.pk': 'cfo123',
  'ali.moeen@grandcity.pk': 'cons123',
  'ali.nadeem@grandcity.pk': 'tech123',
  'muhammad@grandcity.pk': 'mbw123',
  'admin@grandcity.pk': 'adm123',
  
  // Staff, Guard, Receptionist, Admin (by role - will update all users with that role)
  'staff': 'pso123',
  'guard': 'sec123',
  'receptionist': 'front123',
  'admin': 'adm123'
};

async function migratePasswords() {
  console.log('🔐 Starting password migration...\n');

  try {
    // First, get all users from database
    const usersResult = await db.query(`
      SELECT id, email, full_name, role 
      FROM users 
      WHERE is_active = true
      ORDER BY role, full_name
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }

    console.log(`Found ${usersResult.rows.length} active users\n`);

    let updated = 0;
    let skipped = 0;

    for (const user of usersResult.rows) {
      let password = null;

      // Check if user has specific password by email
      if (userPasswords[user.email.toLowerCase()]) {
        password = userPasswords[user.email.toLowerCase()];
      }
      // Otherwise, use role-based password
      else if (userPasswords[user.role]) {
        password = userPasswords[user.role];
      }

      if (password) {
        // Hash the password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Update user in database
        await db.query(
          `UPDATE users 
           SET password_hash = $1, 
               password_changed_at = NOW(),
               failed_login_attempts = 0,
               account_locked_until = NULL
           WHERE id = $2`,
          [passwordHash, user.id]
        );

        console.log(`✅ Updated: ${user.full_name} (${user.email}) - Role: ${user.role}`);
        updated++;
      } else {
        console.log(`⚠️  Skipped: ${user.full_name} (${user.email}) - No password mapping found for role: ${user.role}`);
        skipped++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Updated: ${updated} users`);
    console.log(`   ⚠️  Skipped: ${skipped} users`);
    console.log(`\n✨ Password migration completed successfully!\n`);

    // Display password list for reference
    console.log('📋 Password Reference:');
    console.log('   Executives:');
    console.log('   - Khalid: ceo123');
    console.log('   - Salman: md123');
    console.log('   - Rehan: chair123');
    console.log('   - Shahnawaz: ops123');
    console.log('   - Aslam: cfo123');
    console.log('   - Ali Moeen: cons123');
    console.log('   - Ali Bin Nadeem: tech123');
    console.log('   - Muhammad bin Waris: mbw123');
    console.log('   \n   Roles:');
    console.log('   - Staff: pso123');
    console.log('   - Guard: sec123');
    console.log('   - Receptionist: front123');
    console.log('   - Admin: adm123\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.pool.end();
  }
}

// Run migration
migratePasswords();
