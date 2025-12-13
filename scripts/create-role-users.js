require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../config/database');

const SALT_ROUNDS = 12;

// Role users to create
const roleUsers = [
    {
        email: 'staff@grandcity.pk',
        full_name: 'Staff Member',
        role: 'staff',
        password: 'pso123'
    },
    {
        email: 'guard@grandcity.pk',
        full_name: 'Security Guard',
        role: 'guard',
        password: 'sec123'
    },
    {
        email: 'receptionist@grandcity.pk',
        full_name: 'Receptionist',
        role: 'receptionist',
        password: 'front123'
    }
];

async function createRoleUsers() {
    console.log('🔧 Creating role-based user accounts...\n');

    try {
        for (const user of roleUsers) {
            // Check if user already exists
            const existingUser = await db.query(
                'SELECT id, email FROM users WHERE email = $1',
                [user.email]
            );

            if (existingUser.rows.length > 0) {
                console.log(`✓ User already exists: ${user.email}`);
                
                // Update password if exists
                const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
                await db.query(
                    `UPDATE users 
                     SET password_hash = $1, 
                         password_changed_at = NOW(),
                         failed_login_attempts = 0,
                         account_locked_until = NULL
                     WHERE email = $2`,
                    [passwordHash, user.email]
                );
                console.log(`  ✅ Updated password for ${user.full_name}`);
            } else {
                // Create new user
                const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
                
                await db.query(
                    `INSERT INTO users (email, full_name, role, password_hash, is_active)
                     VALUES ($1, $2, $3, $4, true)`,
                    [user.email, user.full_name, user.role, passwordHash]
                );
                console.log(`  ✅ Created new user: ${user.full_name} (${user.email})`);
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   Total role users: ${roleUsers.length}`);
        console.log('\n✨ Role user accounts ready!\n');

        // Display credentials
        console.log('📋 Login Credentials:');
        roleUsers.forEach(user => {
            console.log(`   ${user.full_name}: ${user.password}`);
        });
        console.log('');

    } catch (error) {
        console.error('❌ Error creating role users:', error);
        process.exit(1);
    } finally {
        await db.pool.end();
    }
}

createRoleUsers();
