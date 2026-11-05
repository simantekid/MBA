import { RequestHandler } from 'express';
import * as mbaService from '../services/mba.service';

export const getBalance: RequestHandler = async (_req, res, next) => {
  try {
    const result = await mbaService.checkBalance();
    res.json(result);
  } catch (err) {
    next(err);
  }
};
