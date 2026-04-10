const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, sku, format } = req.body;
  if (!name) return res.status(400).json({ error: 'Faltan campos.' });
  const fmt = format || 'A';
  try {
    const result = await sql`
      INSERT INTO plate_types (name, sku, format)
      VALUES (${name}, ${sku || null}, ${fmt})
      ON CONFLICT (name) DO UPDATE SET sku = COALESCE(EXCLUDED.sku, plate_types.sku)
      RETURNING *
    `;
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
