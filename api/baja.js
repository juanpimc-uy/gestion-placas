const { sql } = require('@vercel/postgres');

// assigns: [{ posId: string, qty: number, remaining: number }]
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { tid, assigns } = req.body;
  if (!tid || !assigns?.length) return res.status(400).json({ error: 'Faltan datos.' });
  try {
    for (const a of assigns) {
      if (a.remaining === 0) {
        await sql`
          DELETE FROM stock
          WHERE position_id = ${a.posId} AND plate_type_id = ${tid}
        `;
      } else {
        await sql`
          UPDATE stock
          SET quantity = ${a.remaining}, updated_at = NOW()
          WHERE position_id = ${a.posId} AND plate_type_id = ${tid}
        `;
      }
      await sql`
        INSERT INTO movements (plate_type_id, position_id, quantity, movement_type)
        VALUES (${tid}, ${a.posId}, ${a.qty}, 'baja')
      `;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
