import path from 'path';
import { DatabaseSync } from 'node:sqlite';

export const db = new DatabaseSync(path.join(process.cwd(), 'orders.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    idtrx TEXT PRIMARY KEY,
    vendor_idtrx TEXT,
    kode TEXT NOT NULL,
    tujuan TEXT NOT NULL,
    status TEXT NOT NULL,
    sn TEXT,
    msg TEXT,
    price TEXT,
    balance TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// orders.db lama (sebelum ada price/balance) -> tambah kolom kalau belum ada.
const existingColumns = (db.prepare('PRAGMA table_info(orders)').all() as { name: string }[]).map((c) => c.name);
for (const col of ['price', 'balance']) {
  if (!existingColumns.includes(col)) {
    db.exec(`ALTER TABLE orders ADD COLUMN ${col} TEXT`);
  }
}
