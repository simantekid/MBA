import { Router } from 'express';
import { getFileDownload } from '../controllers/fileDownload.controller';

const router = Router();

router.get('/file-download', getFileDownload);

export default router;
