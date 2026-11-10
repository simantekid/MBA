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
`);

const findByIdtrxStmt = db.prepare('SELECT * FROM orders WHERE idtrx = ?');

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
