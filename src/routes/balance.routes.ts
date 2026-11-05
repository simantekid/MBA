import { Router } from 'express';
import { getBalance } from '../controllers/balance.controller';

const router = Router();

router.get('/balance', getBalance);

export default router;
