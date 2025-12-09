require('dotenv').config();
const db = require('../config/database');

(async () => {
    try {
        console.log('=== VISITORS TABLE ===');
        const v = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'visitors' 
            ORDER BY ordinal_position
        `);
        v.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

        console.log('\n=== VISITS TABLE ===');
        const vis = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'visits' 
            ORDER BY ordinal_position
        `);
        vis.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

        await db.pool.end();
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
})();
