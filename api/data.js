const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const [types, positions, stock, movements] = await Promise.all([
      sql`SELECT * FROM plate_types ORDER BY name`,
      sql`SELECT * FROM positions ORDER BY column_id, level NULLS LAST`,
      sql`SELECT * FROM stock`,
      sql`SELECT * FROM movements ORDER BY created_at DESC LIMIT 60`
    ]);
    res.json({
      types:     types.rows,
      positions: positions.rows,
      stock:     stock.rows,
      movements: movements.rows
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
