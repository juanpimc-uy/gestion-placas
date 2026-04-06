const { sql } = require('@vercel/postgres');

// assigns: [{ posId: string, qty: number }]
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { tid, assigns } = req.body;
  if (!tid || !assigns?.length) return res.status(400).json({ error: 'Faltan datos.' });
  try {
    for (const a of assigns) {
      await sql`
        INSERT INTO stock (position_id, plate_type_id, quantity, updated_at)
        VALUES (${a.posId}, ${tid}, ${a.qty}, NOW())
        ON CONFLICT (position_id, plate_type_id)
        DO UPDATE SET
          quantity   = stock.quantity + EXCLUDED.quantity,
          updated_at = NOW()
      `;
      await sql`
        INSERT INTO movements (plate_type_id, position_id, quantity, movement_type)
        VALUES (${tid}, ${a.posId}, ${a.qty}, 'ingreso')
      `;
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
