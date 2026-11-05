import { Router } from 'express';
import { createOrder, getOrderStatus } from '../controllers/order.controller';

const router = Router();

router.get('/order', createOrder);
router.post('/order', createOrder);
router.get('/order_status', getOrderStatus);

export default router;
