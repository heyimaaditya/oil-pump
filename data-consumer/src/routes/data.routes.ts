import { Router } from 'express';
import { getPressureData, getMaterialData, getFluidData } from '../controllers/data.controller';

const router = Router();


router.get('/pressure', getPressureData);
router.get('/material', getMaterialData);
router.get('/fluid', getFluidData);



export default router;