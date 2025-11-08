import mongoose, { Document, Schema } from 'mongoose';

export type LeaveType = 'Sick' | 'Casual' | 'Earned' | 'Maternity' | 'Paternity';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ILeave extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  type: LeaveType;
  from: Date;
  to: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  type: {
    type: String,
    enum: {
      values: ['Sick', 'Casual', 'Earned', 'Maternity', 'Paternity'],
      message: 'Leave type must be one of: Sick, Casual, Earned, Maternity, Paternity'
    },
    required: [true, 'Leave type is required'],
    index: true
  },
  from: {
    type: Date,
    required: [true, 'From date is required'],
    validate: {
      validator: function(value: Date) {
        // From date should not be in the past (except for today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return value >= today;
      },
      message: 'From date cannot be in the past'
    }
  },
  to: {
    type: Date,
    required: [true, 'To date is required'],
    validate: {
      validator: function(this: ILeave, value: Date) {
        // To date should be >= from date
        return value >= this.from;
      },
      message: 'To date must be greater than or equal to from date'
    }
  },
  totalDays: {
    type: Number,
    required: [true, 'Total days is required'],
    min: [0.5, 'Total days must be at least 0.5'],
    max: [365, 'Total days cannot exceed 365']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters'],
    maxlength: [500, 'Reason cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Approved', 'Rejected'],
      message: 'Status must be one of: Pending, Approved, Rejected'
    },
    default: 'Pending',
    index: true
  },
  appliedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(this: ILeave, value: mongoose.Types.ObjectId) {
        // ReviewedBy is required if status is not Pending
        if (this.status !== 'Pending') {
          return !!value;
        }
        return true;
      },
      message: 'Reviewer is required when leave is approved or rejected'
    }
  },
  reviewedAt: {
    type: Date,
    validate: {
      validator: function(this: ILeave, value: Date) {
        // ReviewedAt is required if status is not Pending
        if (this.status !== 'Pending') {
          return !!value;
        }
        return true;
      },
      message: 'Review date is required when leave is approved or rejected'
    }
  },
  reviewComments: {
    type: String,
    trim: true,
    maxlength: [500, 'Review comments cannot be more than 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
leaveSchema.index({ userId: 1, appliedAt: -1 });
leaveSchema.index({ status: 1, appliedAt: -1 });
leaveSchema.index({ from: 1, to: 1 });
leaveSchema.index({ reviewedBy: 1, reviewedAt: -1 });
leaveSchema.index({ type: 1, status: 1 });

// Virtual for user details
leaveSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for reviewer details
leaveSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to calculate total days
leaveSchema.pre('save', function(next) {
  if (this.from && this.to) {
    const diffTime = this.to.getTime() - this.from.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    this.totalDays = diffDays;
  }
  next();
});

// Pre-save middleware to set review timestamp
leaveSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'Pending') {
    if (!this.reviewedAt) {
      this.reviewedAt = new Date();
    }
  }
  next();
});

// Static method to check for overlapping leaves
leaveSchema.statics.checkOverlappingLeaves = function(
  userId: string,
  fromDate: Date,
  toDate: Date,
  excludeLeaveId?: string
) {
  const query: any = {
    userId: new mongoose.Types.ObjectId(userId),
    status: { $in: ['Pending', 'Approved'] },
    $or: [
      { from: { $lte: toDate }, to: { $gte: fromDate } }
    ]
  };

  if (excludeLeaveId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeLeaveId) };
  }

  return this.findOne(query);
};

// Static method to get leave summary for a user
leaveSchema.statics.getLeaveSummary = function(userId: string, year: number) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'Approved',
        from: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        totalDays: { $sum: '$totalDays' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get pending leaves for approval
leaveSchema.statics.getPendingLeaves = function(limit: number = 10) {
  return this.find({ status: 'Pending' })
    .populate('userId', 'name email department position')
    .sort({ appliedAt: 1 })
    .limit(limit);
};

const Leave = mongoose.model<ILeave>('Leave', leaveSchema);

export default Leave;