import { RequestHandler } from 'express';
import * as mbaService from '../services/mba.service';

export const getProducts: RequestHandler = async (_req, res, next) => {
  try {
    const products = await mbaService.getProduct();
    res.json({ products });
  } catch (err) {
    next(err);
  }
};
