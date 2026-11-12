import { db } from '../lib/db';
import { IrsStatus, OrderRecord } from '../types/mba';

const upsertStmt = db.prepare(`
  INSERT INTO orders (idtrx, vendor_idtrx, kode, tujuan, status, sn, msg, price, balance)
  VALUES (@idtrx, @vendor_idtrx, @kode, @tujuan, @status, @sn, @msg, @price, @balance)
  ON CONFLICT(idtrx) DO UPDATE SET
    vendor_idtrx = excluded.vendor_idtrx,
    status = excluded.status,
    sn = excluded.sn,
    msg = excluded.msg,
    price = COALESCE(excluded.price, price),
    balance = COALESCE(excluded.balance, balance),
    updated_at = datetime('now')
  WHERE NOT (orders.status IN ('sukses', 'gagal') AND excluded.status = 'pending')
`);

// Reset eksplisit ke pending buat order baru / retry order 'gagal'. Sengaja tanpa guard di atas.
const startPendingStmt = db.prepare(`
  INSERT INTO orders (idtrx, vendor_idtrx, kode, tujuan, status, sn, msg, price, balance)
  VALUES (@idtrx, NULL, @kode, @tujuan, 'pending', NULL, 'ORDER RECEIVED', NULL, NULL)
  ON CONFLICT(idtrx) DO UPDATE SET
    vendor_idtrx = NULL,
    kode = excluded.kode,
    tujuan = excluded.tujuan,
    status = 'pending',
    sn = NULL,
    msg = excluded.msg,
    price = NULL,
    balance = NULL,
    updated_at = datetime('now')
`);

const findByIdtrxStmt = db.prepare('SELECT * FROM orders WHERE idtrx = ?');

// Dipanggil SEBELUM request ke MBA, biar callback yang datang lebih cepat dari jawaban
// TopupRequest tetap nemu ordernya.
export function startPendingOrder(record: { idtrx: string; kode: string; tujuan: string }) {
  startPendingStmt.run({ idtrx: record.idtrx, kode: record.kode, tujuan: record.tujuan });
}

// Status final (sukses/gagal) tidak pernah diturunkan jadi pending oleh jawaban yang telat.
export function saveOrder(record: {
  idtrx: string;
  vendorIdtrx: string | null;
  kode: string;
  tujuan: string;
  status: IrsStatus;
  sn: string | null;
  msg: string;
  price: string | null;
  balance: string | null;
}) {
  upsertStmt.run({
    idtrx: record.idtrx,
    vendor_idtrx: record.vendorIdtrx,
    kode: record.kode,
    tujuan: record.tujuan,
    status: record.status,
    sn: record.sn,
    msg: record.msg,
    price: record.price,
    balance: record.balance,
  });
}

export function findOrderByIdtrx(idtrx: string): OrderRecord | undefined {
  return findByIdtrxStmt.get(idtrx) as OrderRecord | undefined;
}
