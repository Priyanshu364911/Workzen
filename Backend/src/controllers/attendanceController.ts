import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../middleware/errorHandler';
import AttendanceService from '../services/attendanceService';

export class AttendanceController {
  /**
   * Check in attendance
   * POST /api/attendance/checkin
   */
  static checkIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const attendance = await AttendanceService.checkIn(req.user!._id, req.body);

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      data: {
        attendance
      }
    });
  });

  /**
   * Check out attendance
   * POST /api/attendance/checkout
   */
  static checkOut = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const attendance = await AttendanceService.checkOut(req.user!._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      data: {
        attendance
      }
    });
  });

  /**
   * Get attendance records with pagination and filtering
   * GET /api/attendance/logs
   */
  static getAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // If not Admin/HR, restrict to own records
    if (req.user!.role !== 'Admin' && req.user!.role !== 'HR Officer') {
      req.query.userId = req.user!._id;
    }

    const result = await AttendanceService.getAttendance(req.query as any);

    res.status(200).json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: {
        attendance: result.attendance,
        pagination: result.pagination
      }
    });
  });

  /**
   * Get attendance by ID
   * GET /api/attendance/:id
   */
  static getAttendanceById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const attendance = await AttendanceService.getAttendanceById(req.params.id);

    // Check if user can access this attendance record
    if (req.user!.role !== 'Admin' && req.user!.role !== 'HR Officer') {
      if (attendance.userId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          error: {
            message: 'You can only access your own attendance records'
          }
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record retrieved successfully',
      data: {
        attendance
      }
    });
  });

  /**
   * Create manual attendance entry (Admin/HR only)
   * POST /api/attendance/manual
   */
  static createManualAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const attendance = await AttendanceService.createManualAttendance(req.body);

    res.status(201).json({
      success: true,
      message: 'Manual attendance entry created successfully',
      data: {
        attendance
      }
    });
  });

  /**
   * Update attendance record (Admin/HR only)
   * PUT /api/attendance/:id
   */
  static updateAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const attendance = await AttendanceService.updateAttendance(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: {
        attendance
      }
    });
  });

  /**
   * Delete attendance record (Admin only)
   * DELETE /api/attendance/:id
   */
  static deleteAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await AttendanceService.deleteAttendance(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  });

  /**
   * Get current attendance status
   * GET /api/attendance/status
   */
  static getCurrentStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const status = await AttendanceService.getCurrentAttendanceStatus(req.user!._id);

    res.status(200).json({
      success: true,
      message: 'Current attendance status retrieved successfully',
      data: status
    });
  });

  /**
   * Get user attendance summary
   * GET /api/attendance/summary
   */
  static getUserSummary = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate, userId } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    // If not Admin/HR, restrict to own records
    const targetUserId = (req.user!.role === 'Admin' || req.user!.role === 'HR Officer') 
      ? (userId as string || req.user!._id) 
      : req.user!._id;

    const summary = await AttendanceService.getUserAttendanceSummary(targetUserId, start, end);

    res.status(200).json({
      success: true,
      message: 'Attendance summary retrieved successfully',
      data: summary
    });
  });

  /**
   * Generate attendance report (Admin/HR only)
   * GET /api/attendance/reports
   */
  static generateReport = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const report = await AttendanceService.generateAttendanceReport(req.query as any);

    res.status(200).json({
      success: true,
      message: 'Attendance report generated successfully',
      data: report
    });
  });

  /**
   * Get attendance statistics (Admin/HR only)
   * GET /api/attendance/stats
   */
  static getStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await AttendanceService.getAttendanceStats(start, end);

    res.status(200).json({
      success: true,
      message: 'Attendance statistics retrieved successfully',
      data: stats
    });
  });

  /**
   * Get attendance for specific user (Admin/HR only or own records)
   * GET /api/attendance/user/:userId
   */
  static getUserAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    
    // Check if user can access this user's attendance
    if (req.user!.role !== 'Admin' && req.user!.role !== 'HR Officer') {
      if (userId !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          error: {
            message: 'You can only access your own attendance records'
          }
        });
        return;
      }
    }

    // Set userId in query and get attendance
    req.query.userId = userId;
    const result = await AttendanceService.getAttendance(req.query as any);

    res.status(200).json({
      success: true,
      message: 'User attendance records retrieved successfully',
      data: {
        attendance: result.attendance,
        pagination: result.pagination
      }
    });
  });
}

export default AttendanceController;