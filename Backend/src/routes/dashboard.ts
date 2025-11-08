import { Router } from 'express';
import DashboardController from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard routes (accessible to all authenticated users with role-based data filtering)
router.get('/', DashboardController.getDashboardData);
router.get('/stats', DashboardController.getDashboardStats);
router.get('/charts', DashboardController.getChartData);
router.get('/activities', DashboardController.getRecentActivities);

export default router;