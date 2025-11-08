import mongoose, { Document, Schema } from 'mongoose';

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Late';

export interface IAttendance extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  totalHours?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  checkIn: {
    type: Date,
    validate: {
      validator: function(this: IAttendance, value: Date) {
        // Check-in should be on the same date as the attendance date
        if (value && this.date) {
          const checkInDate = new Date(value);
          const attendanceDate = new Date(this.date);
          return checkInDate.toDateString() === attendanceDate.toDateString();
        }
        return true;
      },
      message: 'Check-in time must be on the same date as attendance date'
    }
  },
  checkOut: {
    type: Date,
    validate: {
      validator: function(this: IAttendance, value: Date) {
        // Check-out should be after check-in
        if (value && this.checkIn) {
          return value > this.checkIn;
        }
        return true;
      },
      message: 'Check-out time must be after check-in time'
    }
  },
  totalHours: {
    type: Number,
    min: [0, 'Total hours cannot be negative'],
    max: [24, 'Total hours cannot exceed 24 hours']
  },
  status: {
    type: String,
    enum: {
      values: ['Present', 'Absent', 'Half Day', 'Late'],
      message: 'Status must be one of: Present, Absent, Half Day, Late'
    },
    required: [true, 'Status is required'],
    index: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters'],
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true }); // One attendance record per user per date
attendanceSchema.index({ date: -1, status: 1 });
attendanceSchema.index({ userId: 1, date: -1 });
attendanceSchema.index({ createdAt: -1 });

// Virtual for user details
attendanceSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate total hours
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diffMs = this.checkOut.getTime() - this.checkIn.getTime();
    this.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
  }
  next();
});

// Pre-save middleware to auto-set status based on check-in time
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.status === 'Present') {
    const checkInHour = this.checkIn.getHours();
    const checkInMinute = this.checkIn.getMinutes();
    
    // Consider late if check-in is after 9:15 AM
    if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 15)) {
      this.status = 'Late';
    }
    
    // Consider half day if check-in is after 1:00 PM
    if (checkInHour >= 13) {
      this.status = 'Half Day';
    }
  }
  next();
});

// Static method to get attendance for a date range
attendanceSchema.statics.getAttendanceByDateRange = function(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlyAttendanceSummary = function(
  userId: string,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
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
};

const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);

export default Attendance;