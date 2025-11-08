import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../middleware/errorHandler';
import DashboardService from '../services/dashboardService';

export class DashboardController {
  /**
   * Get dashboard statistics
   * GET /api/dashboard/stats
   */
  static getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const stats = await DashboardService.getDashboardStats(req.user!.role, req.user!._id);

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        stats
      }
    });
  });

  /**
   * Get chart data for dashboard visualizations
   * GET /api/dashboard/charts
   */
  static getChartData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const chartData = await DashboardService.getChartData(req.user!.role, req.user!._id);

    res.status(200).json({
      success: true,
      message: 'Chart data retrieved successfully',
      data: {
        charts: chartData
      }
    });
  });

  /**
   * Get recent activities
   * GET /api/dashboard/activities
   */
  static getRecentActivities = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { limit = 10 } = req.query;
    
    const activities = await DashboardService.getRecentActivities(
      req.user!.role,
      req.user!._id,
      Number(limit)
    );

    res.status(200).json({
      success: true,
      message: 'Recent activities retrieved successfully',
      data: {
        activities
      }
    });
  });

  /**
   * Get comprehensive dashboard data (stats + charts + activities)
   * GET /api/dashboard
   */
  static getDashboardData = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const [stats, chartData, activities] = await Promise.all([
      DashboardService.getDashboardStats(req.user!.role, req.user!._id),
      DashboardService.getChartData(req.user!.role, req.user!._id),
      DashboardService.getRecentActivities(req.user!.role, req.user!._id, 5)
    ]);

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        stats,
        charts: chartData,
        activities
      }
    });
  });
}

export default DashboardController;