import { db } from '../lib/db';
import { IrsStatus, OrderRecord } from '../types/mba';

const upsertStmt = db.prepare(`
  INSERT INTO orders (idtrx, vendor_idtrx, kode, tujuan, status, sn, msg)
  VALUES (@idtrx, @vendor_idtrx, @kode, @tujuan, @status, @sn, @msg)
  ON CONFLICT(idtrx) DO UPDATE SET
    vendor_idtrx = excluded.vendor_idtrx,
    status = excluded.status,
    sn = excluded.sn,
    msg = excluded.msg,
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
}) {
  upsertStmt.run({
    idtrx: record.idtrx,
    vendor_idtrx: record.vendorIdtrx,
    kode: record.kode,
    tujuan: record.tujuan,
    status: record.status,
    sn: record.sn,
    msg: record.msg,
  });
}

export function findOrderByIdtrx(idtrx: string): OrderRecord | undefined {
  return findByIdtrxStmt.get(idtrx) as OrderRecord | undefined;
}
