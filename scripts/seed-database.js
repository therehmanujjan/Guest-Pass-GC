require('dotenv').config();
const db = require('../config/database');

async function seedDatabase() {
    console.log('🌱 Seeding database...\n');

    try {
        // Executive data
        const executivesData = [
            { name: 'Salman Bin Waris Gillani', position: 'md_partner', email: 'salman@grandcity.pk', department: 'Management' },
            { name: 'Rehan Bin Waris Gillani', position: 'chairman_partner', email: 'rehan@grandcity.pk', department: 'Management' },
            { name: 'Khalid Noon', position: 'ceo', email: 'khalid@grandcity.pk', department: 'Executive' },
            { name: 'Shahnawaz', position: 'director_operations', email: 'shahnawaz@grandcity.pk', department: 'Operations' },
            { name: 'Muhammad Bin Waris Gillani', position: 'director_faisalabad', email: 'muhammad@grandcity.pk', department: 'Faisalabad' },
            { name: 'Ch. Aslam', position: 'cfo', email: 'aslam@grandcity.pk', department: 'Finance' },
            { name: 'Ali Moeen', position: 'consultant', email: 'ali.moeen@grandcity.pk', department: 'Consulting' },
            { name: 'Ali Bin Nadeem', position: 'tech_consultant', email: 'ali.nadeem@grandcity.pk', department: 'Technology' }
        ];

        console.log('📋 Seeding users and executives...');
        for (const exec of executivesData) {
            // Create user first
            const userResult = await db.query(
                `INSERT INTO users (email, full_name, role, department)
                 VALUES ($1, $2, 'executive', $3)
                 ON CONFLICT (email) DO UPDATE
                 SET full_name = EXCLUDED.full_name, department = EXCLUDED.department
                 RETURNING id`,
                [exec.email, exec.name, exec.department]
            );
            const userId = userResult.rows[0].id;

            // Create or update executive
            await db.query(
                `INSERT INTO executives (user_id, title, position)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id) DO UPDATE
                 SET title = EXCLUDED.title, position = EXCLUDED.position`,
                [userId, exec.name, exec.position]
            );
            console.log(`✓ ${exec.name} - ${exec.position}`);
        }

        console.log('\n✅ Database seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
