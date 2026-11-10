import { RequestHandler } from 'express';
import axios from 'axios';
import { config } from '../config/env';
import { findOrderByIdtrx, saveOrder } from '../services/orderStore.service';
import { mapMbaResponseCodeToIrsStatus } from '../lib/statusMapper';
import { IrsOrderResponse, OrderCallbackPayload } from '../types/mba';

async function forwardToIrs(payload: IrsOrderResponse) {
  if (!config.irsCallbackUrl) return;
  try {
    const { status } = await axios.post(config.irsCallbackUrl, payload, { timeout: 10000 });
    console.log('[forward to IRS]', payload.idtrx, '-> HTTP', status);
  } catch (err) {
    // Jangan bikin MBA dapet non-200 gara-gara IRS lagi down; status di db udah
    // keupdate, IRS masih bisa dapet lewat polling /order_status.
    console.error('[forward to IRS] gagal', payload.idtrx, err instanceof Error ? err.message : err);
  }
}

export const handleOrderCallback: RequestHandler = (req, res) => {
  const payload = req.body as OrderCallbackPayload;

  if (!payload?.CRefId) {
    res.status(400).json({ message: 'INVALID_PAYLOAD' });
    return;
  }

  const order = findOrderByIdtrx(payload.CRefId);

  if (!order) {
    console.warn('[order callback] no local order matches CRefId', payload.CRefId, payload.TransID);
    res.status(200).json({ message: 'SUCCESS' });
    return;
  }

  const status = mapMbaResponseCodeToIrsStatus(payload.ResponseCode);
  const vendorIdtrx = payload.TransID || order.vendor_idtrx;
  const sn = payload.SerialNo || order.sn;
  const msg = payload.FullResponse || order.msg;
  const price = payload.ProductPrice || order.price;
  const balance = payload.Balance || order.balance;

  saveOrder({
    idtrx: order.idtrx,
    vendorIdtrx,
    kode: order.kode,
    tujuan: order.tujuan,
    status,
    sn,
    msg,
    price,
    balance,
  });

  console.log('[order callback]', payload.TransID, payload.CRefId, payload.ResponseCode, '-> saved as', status);

  // Balas 200 ke MBA dulu, forward ke IRS jalan di belakang.
  res.status(200).json({ message: 'SUCCESS' });

  void forwardToIrs({
    idtrx: order.idtrx,
    tujuan: order.tujuan,
    kode: order.kode,
    vendor_idtrx: vendorIdtrx,
    status,
    sn,
    msg,
    price,
    balance,
  });
};

// URL Price (dari user): update harga produk dari MBA, format
// dtPList=[pCode:string;pPrice:oldPrice-newPrice]&pCodeMsg=523|524
export const handlePriceCallback: RequestHandler = (req, res) => {
  const raw = String(req.body?.dtPList ?? '');
  const match = raw.match(/pCode:([^;]+);pPrice:([^-]+)-([^\]]+)/);

  if (match) {
    const [, pCode, oldPrice, newPrice] = match;
    console.log('[price callback]', pCode, oldPrice, '->', newPrice, 'pCodeMsg:', req.body?.pCodeMsg);
  } else {
    console.log('[price callback] unparsed payload', req.body);
  }

  res.status(200).json({ message: 'SUCCESS' });
};
