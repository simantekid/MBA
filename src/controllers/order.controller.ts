import { RequestHandler } from 'express';
import * as mbaService from '../services/mba.service';
import axios from 'axios';
import { findOrderByIdtrx, saveOrder, startPendingOrder } from '../services/orderStore.service';
import { mapMbaResponseCodeToIrsStatus } from '../lib/statusMapper';
import { IrsOrderRequest, IrsOrderResponse, OrderRecord } from '../types/mba';

const NOT_SENT_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ENETUNREACH', 'EHOSTUNREACH']);

function isNotSentError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response && !!err.code && NOT_SENT_CODES.has(err.code);
}

function toResponse(order: OrderRecord): IrsOrderResponse {
  return {
    idtrx: order.idtrx,
    tujuan: order.tujuan,
    kode: order.kode,
    vendor_idtrx: order.vendor_idtrx,
    status: order.status,
    sn: order.sn,
    msg: order.msg,
    price: order.price,
    balance: order.balance,
  };
}

// Order pending: tanya status terbaru ke MBA (CheckTransactionStatusDetail), simpan, lalu balikin.
// Callback MBA bisa telat / ga nyampe, jadi db doang ga cukup buat order pending.
async function refreshPendingOrder(order: OrderRecord): Promise<IrsOrderResponse> {
  const result = await mbaService.checkTransactionStatusDetail({ crefId: order.idtrx });

  saveOrder({
    idtrx: order.idtrx,
    vendorIdtrx: result.TransID || order.vendor_idtrx,
    kode: order.kode,
    tujuan: order.tujuan,
    status: mapMbaResponseCodeToIrsStatus(result.ResponseCode),
    sn: result.SerialNo || order.sn,
    msg: result.FullResponse || order.msg,
    price: result.ProductPrice || order.price,
    balance: result.Balance || order.balance,
  });

  return toResponse(findOrderByIdtrx(order.idtrx)!);
}

export const createOrder: RequestHandler = async (req, res, next) => {
  try {
    const source = { ...(req.body as Partial<IrsOrderRequest>), ...req.query } as Record<string, unknown>;
    const payload: IrsOrderRequest = {
      idtrx: String(source.idtrx ?? ''),
      tujuan: String(source.tujuan ?? ''),
      kode: String(source.kode ?? ''),
    };

    if (!payload.idtrx || !payload.tujuan || !payload.kode) {
      res.status(400).json({ code: 'BAD_REQUEST', data: null, message: 'idtrx, tujuan, and kode are required' });
      return;
    }

    // Idempotency guard: idtrx yang sama dikirim ulang (retry IRS) dan order lama
    // masih hidup (pending/sukses) -> jangan request ulang ke MBA. Status 'gagal' sengaja
    // dibiarin lolos biar bisa retry. Kalau masih pending, cek dulu status terbarunya ke MBA
    // (callback bisa telat / ga nyampe); kalau cek gagal, jawab dari db.
    const existing = findOrderByIdtrx(payload.idtrx);
    if (existing && existing.status !== 'gagal') {
      if (existing.status === 'pending') {
        try {
          res.json(await refreshPendingOrder(existing));
          return;
        } catch (err) {
          console.error('[resend pending] cek status ke MBA gagal', existing.idtrx, err instanceof Error ? err.message : err);
        }
      }
      res.json(toResponse(existing));
      return;
    }

    // Simpan dulu sebagai pending SEBELUM request ke MBA: callback MBA bisa masuk lebih cepat
    // dari jawaban TopupRequest, dan kalau ordernya belum ada di db callback-nya kebuang.
    startPendingOrder({ idtrx: payload.idtrx, kode: payload.kode, tujuan: payload.tujuan });

    // CRefId = idtrx kita sendiri; MBA balikin ini lagi di callback buat dicocokin ke orders.db.
    let result;
    try {
      result = await mbaService.topupRequest({
        msisdn: payload.tujuan,
        productCode: payload.kode,
        crefId: payload.idtrx,
      });
    } catch (err) {
      // Request jelas belum nyampe ke MBA -> tandai gagal biar retry IRS dengan idtrx sama bisa lolos.
      // Timeout / error setelah terkirim itu ambigu (mungkin MBA sudah proses) -> biarin pending,
      // nanti diselesaikan callback atau polling /order_status.
      if (isNotSentError(err)) {
        saveOrder({
          idtrx: payload.idtrx,
          vendorIdtrx: null,
          kode: payload.kode,
          tujuan: payload.tujuan,
          status: 'gagal',
          sn: null,
          msg: 'MBA unreachable, request not sent',
          price: null,
          balance: null,
        });
      }
      throw err;
    }

    saveOrder({
      idtrx: payload.idtrx,
      vendorIdtrx: result.TransID || null,
      kode: payload.kode,
      tujuan: payload.tujuan,
      status: mapMbaResponseCodeToIrsStatus(result.ResponseCode),
      sn: result.SerialNo || null,
      msg: result.FullResponse || `response code ${result.ResponseCode}`,
      price: result.ProductPrice || null,
      balance: result.Balance || null,
    });

    // Jawab dari kondisi db sekarang, bukan dari jawaban sync: kalau callback sukses sudah
    // keburu masuk, IRS jangan dikasih pending lagi.
    const current = findOrderByIdtrx(payload.idtrx)!;
    const response: IrsOrderResponse = {
      idtrx: current.idtrx,
      tujuan: current.tujuan,
      kode: current.kode,
      vendor_idtrx: current.vendor_idtrx,
      status: current.status,
      sn: current.sn,
      msg: current.msg,
      price: current.price,
      balance: current.balance,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getOrderStatus: RequestHandler = async (req, res, next) => {
  try {
    const idtrx = req.query.idtrx as string | undefined;

    if (!idtrx) {
      res.status(400).json({ code: 'BAD_REQUEST', data: null, message: 'idtrx is required' });
      return;
    }

    const order = findOrderByIdtrx(idtrx);

    if (!order) {
      res.status(404).json({ code: 'NOT_FOUND', data: null, message: 'idtrx not found' });
      return;
    }

    // Status final (sukses/gagal) biasanya udah keupdate dari callback MBA -> jawab dari db.
    // Cuma status pending yang dicek ulang ke MBA.
    if (order.status === 'sukses' || order.status === 'gagal') {
      res.json(toResponse(order));
      return;
    }

    res.json(await refreshPendingOrder(order));
  } catch (err) {
    next(err);
  }
};
