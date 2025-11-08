import Attendance, { IAttendance, AttendanceStatus } from '../models/Attendance';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';

export interface CheckInData {
  date?: Date;
  notes?: string;
}

export interface CheckOutData {
  date?: Date;
  notes?: string;
}

export interface ManualAttendanceData {
  userId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendanceData {
  checkIn?: Date;
  checkOut?: Date;
  status?: AttendanceStatus;
  notes?: string;
}

export interface GetAttendanceQuery {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AttendanceStatus;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface AttendanceReportQuery {
  startDate: Date;
  endDate: Date;
  userId?: string;
  department?: string;
  status?: AttendanceStatus;
  format: 'json' | 'csv';
}

export interface PaginatedAttendance {
  attendance: IAttendance[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class AttendanceService {
  /**
   * Check in user attendance
   */
  static async checkIn(userId: string, data: CheckInData): Promise<IAttendance> {
    const { date = new Date(), notes } = data;
    
    // Normalize date to start of day for comparison
    const attendanceDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Check if user already has attendance for this date
    const existingAttendance = await Attendance.findOne({
      userId,
      date: attendanceDate
    });

    if (existingAttendance) {
      throw new AppError('Attendance already marked for this date', 400);
    }

    // Verify user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 404);
    }

    // Create attendance record
    const attendance = await Attendance.create({
      userId,
      date: attendanceDate,
      checkIn: new Date(),
      status: 'Present',
      notes
    });

    return attendance;
  }

  /**
   * Check out user attendance
   */
  static async checkOut(userId: string, data: CheckOutData): Promise<IAttendance> {
    const { date = new Date(), notes } = data;
    
    // Normalize date to start of day for comparison
    const attendanceDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Find existing attendance record
    const attendance = await Attendance.findOne({
      userId,
      date: attendanceDate
    });

    if (!attendance) {
      throw new AppError('No check-in record found for this date', 404);
    }

    if (attendance.checkOut) {
      throw new AppError('Already checked out for this date', 400);
    }

    // Update attendance with check-out time
    attendance.checkOut = new Date();
    if (notes) {
      attendance.notes = notes;
    }

    await attendance.save();
    return attendance;
  }

  /**
   * Get attendance records with pagination and filtering
   */
  static async getAttendance(query: GetAttendanceQuery): Promise<PaginatedAttendance> {
    const {
      userId,
      startDate,
      endDate,
      status,
      page,
      limit,
      sortBy,
      sortOrder
    } = query;

    // Build filter object
    const filter: any = {};

    if (userId) {
      filter.userId = userId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = startDate;
      }
      if (endDate) {
        filter.date.$lte = endDate;
      }
    }

    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [attendance, totalRecords] = await Promise.all([
      Attendance.find(filter)
        .populate('user', 'name email department position')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      attendance,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get attendance by ID
   */
  static async getAttendanceById(attendanceId: string): Promise<IAttendance> {
    const attendance = await Attendance.findById(attendanceId)
      .populate('user', 'name email department position');
    
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }

    return attendance;
  }

  /**
   * Create manual attendance entry (Admin/HR only)
   */
  static async createManualAttendance(data: ManualAttendanceData): Promise<IAttendance> {
    const { userId, date, checkIn, checkOut, status, notes } = data;

    // Normalize date to start of day
    const attendanceDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check if attendance already exists for this user and date
    const existingAttendance = await Attendance.findOne({
      userId,
      date: attendanceDate
    });

    if (existingAttendance) {
      throw new AppError('Attendance already exists for this user and date', 400);
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Create attendance record
    const attendance = await Attendance.create({
      userId,
      date: attendanceDate,
      checkIn,
      checkOut,
      status,
      notes
    });

    return attendance;
  }

  /**
   * Update attendance record (Admin/HR only)
   */
  static async updateAttendance(attendanceId: string, data: UpdateAttendanceData): Promise<IAttendance> {
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      data,
      {
        new: true,
        runValidators: true
      }
    ).populate('userId', 'name email department position');

    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }

    return attendance;
  }

  /**
   * Delete attendance record (Admin only)
   */
  static async deleteAttendance(attendanceId: string): Promise<void> {
    const attendance = await Attendance.findByIdAndDelete(attendanceId);
    
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }
  }

  /**
   * Get user's current attendance status
   */
  static async getCurrentAttendanceStatus(userId: string): Promise<{
    hasCheckedIn: boolean;
    hasCheckedOut: boolean;
    attendance?: IAttendance;
  }> {
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const attendance = await Attendance.findOne({
      userId,
      date: todayDate
    });

    return {
      hasCheckedIn: !!attendance,
      hasCheckedOut: !!(attendance && attendance.checkOut),
      attendance: attendance || undefined
    };
  }

  /**
   * Get attendance summary for a user
   */
  static async getUserAttendanceSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const summary = await Attendance.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$totalHours' }
        }
      }
    ]);

    const totalDays = await Attendance.countDocuments({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    return {
      summary,
      totalDays,
      period: { startDate, endDate }
    };
  }

  /**
   * Generate attendance report
   */
  static async generateAttendanceReport(query: AttendanceReportQuery): Promise<any> {
    const { startDate, endDate, userId, department, status } = query;

    // Build match stage for aggregation
    const matchStage: any = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (userId) {
      matchStage.userId = userId;
    }

    if (status) {
      matchStage.status = status;
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ];

    // Add department filter if specified
    if (department) {
      pipeline.push({
        $match: {
          'user.department': { $regex: department, $options: 'i' }
        }
      });
    }

    // Add projection for clean output
    pipeline.push({
      $project: {
        date: 1,
        checkIn: 1,
        checkOut: 1,
        totalHours: 1,
        status: 1,
        notes: 1,
        'user.name': 1,
        'user.email': 1,
        'user.department': 1,
        'user.position': 1
      }
    });

    // Sort by date and user name
    pipeline.push({
      $sort: { date: -1, 'user.name': 1 }
    });

    const reportData = await Attendance.aggregate(pipeline);

    // Generate summary statistics
    const summaryPipeline = [...pipeline];
    summaryPipeline.pop(); // Remove sort stage
    summaryPipeline.push({
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalHours: { $sum: '$totalHours' }
      }
    });

    const summary = await Attendance.aggregate(summaryPipeline);

    return {
      data: reportData,
      summary,
      period: { startDate, endDate },
      totalRecords: reportData.length
    };
  }

  /**
   * Get attendance statistics
   */
  static async getAttendanceStats(startDate?: Date, endDate?: Date): Promise<any> {
    const matchStage: any = {};
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = startDate;
      if (endDate) matchStage.date.$lte = endDate;
    }

    const stats = await Attendance.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$totalHours' },
          avgHours: { $avg: '$totalHours' }
        }
      }
    ]);

    const totalRecords = await Attendance.countDocuments(matchStage);

    return {
      stats,
      totalRecords,
      period: startDate && endDate ? { startDate, endDate } : null
    };
  }
}

export default AttendanceService;