import { Router } from 'express';
import { requestDeposit } from '../controllers/deposit.controller';

const router = Router();

router.post('/deposit', requestDeposit);

export default router;
