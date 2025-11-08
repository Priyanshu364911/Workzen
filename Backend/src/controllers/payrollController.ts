import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../middleware/errorHandler';
import PayrollService from '../services/payrollService';

export class PayrollController {
  /**
   * Process payroll for specified users or all users
   * POST /api/payroll/process
   */
  static processPayroll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const result = await PayrollService.processPayroll(req.user!._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Payroll processing completed',
      data: {
        processed: result.processed.length,
        skipped: result.skipped.length,
        processedRecords: result.processed,
        skippedRecords: result.skipped,
        summary: result.summary
      }
    });
  });

  /**
   * Get payroll records with pagination and filtering
   * GET /api/payroll
   */
  static getPayroll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // If not Admin/Payroll Officer, restrict to own records
    if (!['Admin', 'Payroll Officer'].includes(req.user!.role)) {
      req.query.userId = req.user!._id;
    }

    const result = await PayrollService.getPayroll(req.query as any);

    res.status(200).json({
      success: true,
      message: 'Payroll records retrieved successfully',
      data: {
        payroll: result.payroll,
        pagination: result.pagination
      }
    });
  });

  /**
   * Get payroll by ID
   * GET /api/payroll/:id
   */
  static getPayrollById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const payroll = await PayrollService.getPayrollById(req.params.id);

    // Check if user can access this payroll record
    if (!['Admin', 'Payroll Officer'].includes(req.user!.role)) {
      if (payroll.userId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          error: {
            message: 'You can only access your own payroll records'
          }
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payroll record retrieved successfully',
      data: {
        payroll
      }
    });
  });

  /**
   * Update payroll record (Admin/Payroll Officer only)
   * PUT /api/payroll/:id
   */
  static updatePayroll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const payroll = await PayrollService.updatePayroll(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Payroll record updated successfully',
      data: {
        payroll
      }
    });
  });

  /**
   * Delete payroll record (Admin only)
   * DELETE /api/payroll/:id
   */
  static deletePayroll = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await PayrollService.deletePayroll(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Payroll record deleted successfully'
    });
  });

  /**
   * Get payroll by month
   * GET /api/payroll/month/:month
   */
  static getPayrollByMonth = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const payroll = await PayrollService.getPayrollByMonth(req.params.month);

    res.status(200).json({
      success: true,
      message: 'Monthly payroll records retrieved successfully',
      data: {
        payroll
      }
    });
  });

  /**
   * Get user payroll history
   * GET /api/payroll/user/:userId/history
   */
  static getUserPayrollHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { limit = 12 } = req.query;

    // Check if user can access this user's payroll history
    if (!['Admin', 'Payroll Officer'].includes(req.user!.role)) {
      if (userId !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          error: {
            message: 'You can only access your own payroll history'
          }
        });
        return;
      }
    }

    const payroll = await PayrollService.getUserPayrollHistory(userId, Number(limit));

    res.status(200).json({
      success: true,
      message: 'User payroll history retrieved successfully',
      data: {
        payroll
      }
    });
  });

  /**
   * Update user salary (Admin/Payroll Officer only)
   * PUT /api/payroll/salary/:userId
   */
  static updateUserSalary = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { basicSalary } = req.body;

    const user = await PayrollService.updateUserSalary(userId, basicSalary);

    res.status(200).json({
      success: true,
      message: 'User salary updated successfully',
      data: {
        user
      }
    });
  });

  /**
   * Generate payroll report (Admin/Payroll Officer only)
   * GET /api/payroll/reports
   */
  static generateReport = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const report = await PayrollService.generatePayrollReport(req.query as any);

    res.status(200).json({
      success: true,
      message: 'Payroll report generated successfully',
      data: report
    });
  });

  /**
   * Get payroll statistics (Admin/Payroll Officer only)
   * GET /api/payroll/stats
   */
  static getStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { month } = req.query;
    const stats = await PayrollService.getPayrollStats(month as string);

    res.status(200).json({
      success: true,
      message: 'Payroll statistics retrieved successfully',
      data: {
        stats
      }
    });
  });

  /**
   * Calculate payroll preview (without saving)
   * POST /api/payroll/preview
   */
  static calculatePreview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { month, userIds, workingDays } = req.body;
    const result = await PayrollService.calculatePayrollPreview(month, userIds, workingDays);

    res.status(200).json({
      success: true,
      message: 'Payroll preview calculated successfully',
      data: result
    });
  });

  /**
   * Get payslips for user (own payslips or Admin/Payroll Officer can see all)
   * GET /api/payroll/payslips
   */
  static getPayslips = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // If not Admin/Payroll Officer, restrict to own payslips
    if (!['Admin', 'Payroll Officer'].includes(req.user!.role)) {
      req.query.userId = req.user!._id;
    }

    // Only show processed or paid payslips to employees
    if (req.user!.role === 'Employee') {
      req.query.status = req.query.status || 'Processed,Paid';
    }

    const result = await PayrollService.getPayroll(req.query as any);

    res.status(200).json({
      success: true,
      message: 'Payslips retrieved successfully',
      data: {
        payslips: result.payroll,
        pagination: result.pagination
      }
    });
  });
}

export default PayrollController;