import { RequestHandler } from 'express';
import * as mbaService from '../services/mba.service';

export const requestDeposit: RequestHandler = async (req, res, next) => {
  try {
    const { idBank, refBank, amount, merchantType, remarks, pType } = (req.body ?? {}) as Record<string, string>;

    if (!idBank || !refBank || !amount || !merchantType) {
      res.status(400).json({
        code: 'BAD_REQUEST',
        message: 'idBank, refBank, amount, and merchantType are required',
      });
      return;
    }

    const result = await mbaService.reqDepMer({
      idBank,
      refBank,
      amount: String(amount),
      merchantType: String(merchantType),
      remarks: remarks ?? '',
      pType: pType || '657',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
