import { Router } from 'express';
import orderRoutes from './order.routes';
import balanceRoutes from './balance.routes';
import productRoutes from './product.routes';
import changePasswordRoutes from './changePassword.routes';
import depositRoutes from './deposit.routes';
import fileDownloadRoutes from './fileDownload.routes';
import callbackRoutes from './callback.routes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    code: 'OK',
    message: 'MBA module API is running',
  });
});

router.use(orderRoutes);
router.use(balanceRoutes);
router.use(productRoutes);
router.use(changePasswordRoutes);
router.use(depositRoutes);
router.use(fileDownloadRoutes);
router.use(callbackRoutes);

export default router;
