import { RequestHandler } from 'express';
import * as mbaService from '../services/mba.service';
import { findOrderByIdtrx, saveOrder } from '../services/orderStore.service';
import { mapMbaResponseCodeToIrsStatus } from '../lib/statusMapper';
import { IrsOrderRequest, IrsOrderResponse } from '../types/mba';

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

    // CRefId = idtrx kita sendiri; MBA balikin ini lagi di callback buat dicocokin ke orders.db.
    const result = await mbaService.topupRequest({
      msisdn: payload.tujuan,
      productCode: payload.kode,
      crefId: payload.idtrx,
    });

    const status = mapMbaResponseCodeToIrsStatus(result.ResponseCode);
    const vendorIdtrx = result.TransID || null;
    const sn = result.SerialNo || null;
    const msg = result.FullResponse || `response code ${result.ResponseCode}`;
    const price = result.ProductPrice || null;
    const balance = result.Balance || null;

    saveOrder({
      idtrx: payload.idtrx,
      vendorIdtrx,
      kode: payload.kode,
      tujuan: payload.tujuan,
      status,
      sn,
      msg,
      price,
      balance,
    });

    const response: IrsOrderResponse = {
      idtrx: payload.idtrx,
      tujuan: payload.tujuan,
      kode: payload.kode,
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
