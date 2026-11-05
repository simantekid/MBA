import { RequestHandler } from 'express';
import * as mbaService from '../services/mba.service';

export const getFileDownload: RequestHandler = async (req, res, next) => {
  try {
    const crefId = req.query.crefId as string | undefined;
    const transId = req.query.transId as string | undefined;

    if (!crefId || !transId) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'crefId and transId are required' });
      return;
    }

    const result = await mbaService.getOrCheckFileDwnld({ crefId, transId });
    res.json(result);
  } catch (err) {
    next(err);
  }
};
