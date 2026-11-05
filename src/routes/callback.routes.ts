import { Router } from 'express';
import { handleOrderCallback, handlePriceCallback } from '../controllers/callback.controller';

const router = Router();

router.post('/callback/order', handleOrderCallback);
router.post('/callback/price', handlePriceCallback);

export default router;
