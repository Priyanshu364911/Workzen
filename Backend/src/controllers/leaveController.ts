import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../middleware/errorHandler';
import LeaveService from '../services/leaveService';

export class LeaveController {
  /**
   * Apply for leave
   * POST /api/leaves/apply
   */
  static applyLeave = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const leave = await LeaveService.applyLeave(req.user!._id, req.body);

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: {
        leave
      }
    });
  });

  /**
   * Get leave applications with pagination and filtering
   * GET /api/leaves
   */
  static getLeaves = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // If not Admin/HR/Payroll Officer, restrict to own records
    if (!['Admin', 'HR Officer', 'Payroll Officer'].includes(req.user!.role)) {
      req.query.userId = req.user!._id;
    }

    const result = await LeaveService.getLeaves(req.query as any);

    res.status(200).json({
      success: true,
      message: 'Leave applications retrieved successfully',
      data: {
        leaves: result.leaves,
        pagination: result.pagination
      }
    });
  });

  /**
   * Get leave by ID
   * GET /api/leaves/:id
   */
  static getLeaveById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const leave = await LeaveService.getLeaveById(req.params.id);

    // Check if user can access this leave record
    if (!['Admin', 'HR Officer', 'Payroll Officer'].includes(req.user!.role)) {
      if (leave.userId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          error: {
            message: 'You can only access your own leave applications'
          }
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Leave application retrieved successfully',
      data: {
        leave
      }
    });
  });

  /**
   * Approve leave application
   * PUT /api/leaves/:id/approve
   */
  static approveLeave = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const leave = await LeaveService.reviewLeave(
      req.params.id,
      req.user!._id,
      { status: 'Approved', reviewComments: req.body.reviewComments }
    );

    res.status(200).json({
      success: true,
      message: 'Leave application approved successfully',
      data: {
        leave
      }
    });
  });

  /**
   * Reject leave application
   * PUT /api/leaves/:id/reject
   */
  static rejectLeave = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const leave = await LeaveService.reviewLeave(
      req.params.id,
      req.user!._id,
      { status: 'Rejected', reviewComments: req.body.reviewComments }
    );

    res.status(200).json({
      success: true,
      message: 'Leave application rejected successfully',
      data: {
        leave
      }
    });
  });

  /**
   * Update leave application (Admin/HR only)
   * PUT /api/leaves/:id
   */
  static updateLeave = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const leave = await LeaveService.updateLeave(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Leave application updated successfully',
      data: {
        leave
      }
    });
  });

  /**
   * Delete leave application
   * DELETE /api/leaves/:id
   */
  static deleteLeave = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Admin can delete any leave, others can only delete their own pending leaves
    const userId = req.user!.role === 'Admin' ? undefined : req.user!._id;
    
    await LeaveService.deleteLeave(req.params.id, userId);

    res.status(200).json({
      success: true,
      message: 'Leave application deleted successfully'
    });
  });

  /**
   * Get leave balance
   * GET /api/leaves/balance
   */
  static getLeaveBalance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, year } = req.query;
    
    // If not Admin/HR, restrict to own balance
    const targetUserId = (['Admin', 'HR Officer'].includes(req.user!.role) && userId) 
      ? userId as string 
      : req.user!._id;
    
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const balance = await LeaveService.getLeaveBalance(targetUserId, targetYear);

    res.status(200).json({
      success: true,
      message: 'Leave balance retrieved successfully',
      data: {
        balance
      }
    });
  });

  /**
   * Allocate leave balance (Admin/HR only)
   * POST /api/leaves/allocate
   */
  static allocateLeaveBalance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const balance = await LeaveService.allocateLeaveBalance(req.body);

    res.status(200).json({
      success: true,
      message: 'Leave balance allocated successfully',
      data: {
        balance
      }
    });
  });

  /**
   * Get pending leaves for approval
   * GET /api/leaves/pending
   */
  static getPendingLeaves = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { limit = 10 } = req.query;
    const leaves = await LeaveService.getPendingLeaves(Number(limit));

    res.status(200).json({
      success: true,
      message: 'Pending leave applications retrieved successfully',
      data: {
        leaves
      }
    });
  });

  /**
   * Get user leave summary
   * GET /api/leaves/summary
   */
  static getUserLeaveSummary = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, year } = req.query;
    
    // If not Admin/HR, restrict to own summary
    const targetUserId = (['Admin', 'HR Officer'].includes(req.user!.role) && userId) 
      ? userId as string 
      : req.user!._id;
    
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();

    const summary = await LeaveService.getUserLeaveSummary(targetUserId, targetYear);

    res.status(200).json({
      success: true,
      message: 'Leave summary retrieved successfully',
      data: summary
    });
  });

  /**
   * Get leave statistics (Admin/HR only)
   * GET /api/leaves/stats
   */
  static getLeaveStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await LeaveService.getLeaveStats(start, end);

    res.status(200).json({
      success: true,
      message: 'Leave statistics retrieved successfully',
      data: stats
    });
  });

  /**
   * Get leaves for specific user (Admin/HR only or own records)
   * GET /api/leaves/user/:userId
   */
  static getUserLeaves = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    
    // Check if user can access this user's leaves
    if (!['Admin', 'HR Officer', 'Payroll Officer'].includes(req.user!.role)) {
      if (userId !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          error: {
            message: 'You can only access your own leave applications'
          }
        });
        return;
      }
    }

    // Set userId in query and get leaves
    req.query.userId = userId;
    const result = await LeaveService.getLeaves(req.query as any);

    res.status(200).json({
      success: true,
      message: 'User leave applications retrieved successfully',
      data: {
        leaves: result.leaves,
        pagination: result.pagination
      }
    });
  });
}

export default LeaveController;