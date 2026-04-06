const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  try {
    // ── TABLES ────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS plate_types (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL UNIQUE,
        format     TEXT NOT NULL CHECK (format IN ('A','B','X')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS positions (
        id        TEXT PRIMARY KEY,
        column_id TEXT NOT NULL,
        level     INT,
        format    TEXT NOT NULL CHECK (format IN ('A','B','X')),
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

    // ── SEED POSITIONS (skip if already seeded) ───────────
    const existing = await sql`SELECT COUNT(*) FROM positions`;
    if (parseInt(existing.rows[0].count) === 0) {
      // Formato A (122 cm): 4 columnas × 5 niveles, cap 40 c/u
      const colsA = ['A1','A2','A3','A4'];
      for (const col of colsA) {
        for (let n = 1; n <= 5; n++) {
          await sql`
            INSERT INTO positions (id, column_id, level, format, capacity)
            VALUES (${col+'-'+n}, ${col}, ${n}, 'A', 40)
            ON CONFLICT (id) DO NOTHING
          `;
        }
      }
      // Formato B (180 cm): 2 columnas × 5 niveles, cap 25 c/u
      const colsB = ['B1','B2'];
      for (const col of colsB) {
        for (let n = 1; n <= 5; n++) {
          await sql`
            INSERT INTO positions (id, column_id, level, format, capacity)
            VALUES (${col+'-'+n}, ${col}, ${n}, 'B', 25)
            ON CONFLICT (id) DO NOTHING
          `;
        }
      }
      // Columna especial: 1 nivel, cap 150
      await sql`
        INSERT INTO positions (id, column_id, level, format, capacity)
        VALUES ('X1', 'X1', NULL, 'X', 150)
        ON CONFLICT (id) DO NOTHING
      `;
    }

    res.json({ ok: true, message: 'Base de datos inicializada correctamente.' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
};
