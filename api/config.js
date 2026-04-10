const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).end();
  const { posId, capacity } = req.body;
  if (!posId || !capacity) return res.status(400).json({ error: 'Faltan datos.' });
  const cap = parseInt(capacity);
  if (isNaN(cap) || cap < 1) return res.status(400).json({ error: 'Capacidad inválida.' });
  try {
    await sql`UPDATE positions SET capacity=${cap} WHERE id=${posId}`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
