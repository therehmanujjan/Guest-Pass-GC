require('dotenv').config();
const db = require('../config/database');

(async () => {
    try {
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'executives'
            ORDER BY ordinal_position
        `);
        console.log('Executives table columns:');
        res.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });
        await db.pool.end();
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
})();
