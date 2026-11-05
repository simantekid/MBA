import { RequestHandler } from 'express';
import * as mbaService from '../services/mba.service';

export const changeTransactionPassword: RequestHandler = async (req, res, next) => {
  try {
    const newSignKey = String(req.body?.newSignKey ?? '');

    if (!newSignKey) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'newSignKey is required' });
      return;
    }

    const result = await mbaService.changePassTrx({ newSignKey });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const changeWebsitePassword: RequestHandler = async (req, res, next) => {
  try {
    const { unWeb, passWeb, newPassWeb } = (req.body ?? {}) as Record<string, string>;

    if (!unWeb || !passWeb || !newPassWeb) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'unWeb, passWeb, and newPassWeb are required' });
      return;
    }

    const result = await mbaService.changePassWeb({ unWeb, passWeb, newPassWeb });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
