const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      const updates = req.body;
      const updateFields = [];
      const values = [];
      let valueIndex = 1;

      if (updates.status) {
        updateFields.push(`visit_status = $${valueIndex++}`);
        values.push(updates.status);
      }
      if (updates.approval) {
        updateFields.push(`approval_status = $${valueIndex++}`);
        values.push(updates.approval);
      }
      if (updates.checkinTime) {
        updateFields.push(`actual_checkin_time = $${valueIndex++}`);
        values.push(updates.checkinTime);
      }
      if (updates.checkoutTime) {
        updateFields.push(`actual_checkout_time = $${valueIndex++}`);
        values.push(updates.checkoutTime);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      values.push(id);
      const query = `UPDATE visits SET ${updateFields.join(', ')} WHERE id = $${valueIndex} RETURNING *`;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Visit not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const result = await pool.query('DELETE FROM visits WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Visit not found' });
      }

      return res.status(200).json({ message: 'Visit deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
