const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, format } = req.body;
  if (!name || !format) return res.status(400).json({ error: 'Faltan campos.' });
  try {
    const result = await sql`
      INSERT INTO plate_types (name, format)
      VALUES (${name}, ${format})
      RETURNING *
    `;
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
