import { ErrorRequestHandler } from 'express';
import axios from 'axios';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (axios.isAxiosError(err)) {
    console.error('[MBA SOAP error]', err.message);
    res.status(502).json({ code: 'SYSTEM_ERROR', data: null, message: 'MBA API unreachable' });
    return;
  }

  console.error(err);
  res.status(500).json({
    code: 'SYSTEM_ERROR',
    data: null,
    message: err instanceof Error ? err.message : 'Unknown error',
  });
};
