import { Router } from 'express';
import { AvailabilityController } from '../controllers/availabilityController';

const router = Router();

router.get('/', AvailabilityController.getAvailability);

export default router;
