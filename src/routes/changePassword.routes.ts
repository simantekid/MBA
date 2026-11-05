import { Router } from 'express';
import { changeTransactionPassword, changeWebsitePassword } from '../controllers/changePassword.controller';

const router = Router();

router.post('/change-password/transaction', changeTransactionPassword);
router.post('/change-password/website', changeWebsitePassword);

export default router;
