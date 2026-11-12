import { RequestHandler } from 'express';
import * as mbaService from '../services/mba.service';
import axios from 'axios';
import { findOrderByIdtrx, saveOrder, startPendingOrder } from '../services/orderStore.service';
import { mapMbaResponseCodeToIrsStatus } from '../lib/statusMapper';
import { IrsOrderRequest, IrsOrderResponse } from '../types/mba';

const NOT_SENT_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ENETUNREACH', 'EHOSTUNREACH']);

function isNotSentError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response && !!err.code && NOT_SENT_CODES.has(err.code);
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
    // masih hidup (pending/sukses) -> jawab kondisi terkini dari db, jangan request ulang
    // ke MBA. Status 'gagal' sengaja dibiarin lolos biar bisa retry.
    const existing = findOrderByIdtrx(payload.idtrx);
    if (existing && existing.status !== 'gagal') {
      res.json({
        idtrx: existing.idtrx,
        tujuan: existing.tujuan,
        kode: existing.kode,
        vendor_idtrx: existing.vendor_idtrx,
        status: existing.status,
        sn: existing.sn,
        msg: existing.msg,
        price: existing.price,
        balance: existing.balance,
      } satisfies IrsOrderResponse);
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
      res.json({
        idtrx: order.idtrx,
        tujuan: order.tujuan,
        kode: order.kode,
        vendor_idtrx: order.vendor_idtrx,
        status: order.status,
        sn: order.sn,
        msg: order.msg,
        price: order.price,
        balance: order.balance,
      } satisfies IrsOrderResponse);
      return;
    }

    const result = await mbaService.checkTransactionStatusDetail({ crefId: order.idtrx });
    const status = mapMbaResponseCodeToIrsStatus(result.ResponseCode);
    const vendorIdtrx = result.TransID || order.vendor_idtrx;
    const sn = result.SerialNo || order.sn;
    const msg = result.FullResponse || order.msg;
    const price = result.ProductPrice || order.price;
    const balance = result.Balance || order.balance;

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

    const response: IrsOrderResponse = {
      idtrx: order.idtrx,
      tujuan: order.tujuan,
      kode: order.kode,
      vendor_idtrx: vendorIdtrx,
      status,
      sn,
      msg,
      price,
      balance,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};
