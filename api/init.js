const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS plate_types (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL UNIQUE,
        sku        TEXT,
        format     TEXT NOT NULL CHECK (format IN ('A','B')) DEFAULT 'A',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    // Add sku column if missing (migration)
    await sql`ALTER TABLE plate_types ADD COLUMN IF NOT EXISTS sku TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS positions (
        id        TEXT PRIMARY KEY,
        column_id TEXT NOT NULL,
        level     INT,
        format    TEXT NOT NULL CHECK (format IN ('A','B')),
        capacity  INT NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS stock (
        id            SERIAL PRIMARY KEY,
        position_id   TEXT NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
        plate_type_id INT  NOT NULL REFERENCES plate_types(id) ON DELETE CASCADE,
        quantity      INT  NOT NULL CHECK (quantity > 0),
        updated_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (position_id, plate_type_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS movements (
        id            BIGSERIAL PRIMARY KEY,
        plate_type_id INT  NOT NULL REFERENCES plate_types(id),
        position_id   TEXT NOT NULL REFERENCES positions(id),
        quantity      INT  NOT NULL,
        movement_type TEXT NOT NULL CHECK (movement_type IN ('ingreso','baja')),
        notes         TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const existing = await sql`SELECT COUNT(*) FROM positions`;
    if (parseInt(existing.rows[0].count) === 0) {
      const colsA = ['A1','A2','A3','A4'];
      for (const col of colsA) {
        for (let n = 1; n <= 5; n++) {
          await sql`INSERT INTO positions (id,column_id,level,format,capacity) VALUES (${col+'-'+n},${col},${n},'A',40) ON CONFLICT (id) DO NOTHING`;
        }
      }
      const colsB = ['B1','B2'];
      for (const col of colsB) {
        for (let n = 1; n <= 5; n++) {
          await sql`INSERT INTO positions (id,column_id,level,format,capacity) VALUES (${col+'-'+n},${col},${n},'B',25) ON CONFLICT (id) DO NOTHING`;
        }
      }
      await sql`INSERT INTO positions (id,column_id,level,format,capacity) VALUES ('X1','X1',NULL,'B',150) ON CONFLICT (id) DO NOTHING`;
    }

    // Migrate X1 to format B if needed
    await sql`UPDATE positions SET format='B', capacity=150 WHERE id='X1' AND format='X'`;

    res.json({ ok: true, message: 'Base de datos inicializada.' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
