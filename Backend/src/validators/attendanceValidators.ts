import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Check-in validation schema
export const checkInSchema = Joi.object({
  date: Joi.date()
    .optional()
    .default(() => new Date()),
  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes cannot be more than 500 characters'
    })
});

// Check-out validation schema
export const checkOutSchema = Joi.object({
  date: Joi.date()
    .optional()
    .default(() => new Date()),
  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes cannot be more than 500 characters'
    })
});

// Manual attendance entry schema (Admin/HR only)
export const manualAttendanceSchema = Joi.object({
  userId: Joi.string()
    .required()
    .messages({
      'any.required': 'User ID is required'
    }),
  date: Joi.date()
    .required()
    .messages({
      'any.required': 'Date is required'
    }),
  checkIn: Joi.date()
    .optional(),
  checkOut: Joi.date()
    .optional(),
  status: Joi.string()
    .valid('Present', 'Absent', 'Half Day', 'Late')
    .required()
    .messages({
      'any.only': 'Status must be one of: Present, Absent, Half Day, Late',
      'any.required': 'Status is required'
    }),
  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes cannot be more than 500 characters'
    })
});

// Update attendance schema (Admin/HR only)
export const updateAttendanceSchema = Joi.object({
  checkIn: Joi.date()
    .optional(),
  checkOut: Joi.date()
    .optional(),
  status: Joi.string()
    .valid('Present', 'Absent', 'Half Day', 'Late')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Present, Absent, Half Day, Late'
    }),
  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes cannot be more than 500 characters'
    })
});

// Attendance query parameters schema
export const getAttendanceQuerySchema = Joi.object({
  userId: Joi.string()
    .optional(),
  startDate: Joi.date()
    .optional(),
  endDate: Joi.date()
    .optional()
    .when('startDate', {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref('startDate')),
      otherwise: Joi.date()
    })
    .messages({
      'date.min': 'End date must be greater than or equal to start date'
    }),
  status: Joi.string()
    .valid('Present', 'Absent', 'Half Day', 'Late')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Present, Absent, Half Day, Late'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot be more than 100'
    }),
  sortBy: Joi.string()
    .valid('date', 'checkIn', 'checkOut', 'totalHours', 'status', 'createdAt')
    .default('date')
    .messages({
      'any.only': 'Sort by must be one of: date, checkIn, checkOut, totalHours, status, createdAt'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
});

// Attendance report query schema
export const attendanceReportQuerySchema = Joi.object({
  startDate: Joi.date()
    .required()
    .messages({
      'any.required': 'Start date is required'
    }),
  endDate: Joi.date()
    .required()
    .min(Joi.ref('startDate'))
    .messages({
      'any.required': 'End date is required',
      'date.min': 'End date must be greater than or equal to start date'
    }),
  userId: Joi.string()
    .optional(),
  department: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Department cannot be more than 50 characters'
    }),
  status: Joi.string()
    .valid('Present', 'Absent', 'Half Day', 'Late')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Present, Absent, Half Day, Late'
    }),
  format: Joi.string()
    .valid('json', 'csv')
    .default('json')
    .messages({
      'any.only': 'Format must be either json or csv'
    })
});

// Validation middleware factory
export const validateRequest = (schema: Joi.ObjectSchema, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = source === 'body' ? req.body : req.query;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join('. ');
      
      return next(new AppError(errorMessage, 400));
    }

    // Replace req data with validated and sanitized data
    if (source === 'body') {
      req.body = value;
    } else {
      req.query = value;
    }
    
    next();
  };
};

// Specific validation middlewares
export const validateCheckIn = validateRequest(checkInSchema);
export const validateCheckOut = validateRequest(checkOutSchema);
export const validateManualAttendance = validateRequest(manualAttendanceSchema);
export const validateUpdateAttendance = validateRequest(updateAttendanceSchema);
export const validateGetAttendanceQuery = validateRequest(getAttendanceQuerySchema, 'query');
export const validateAttendanceReportQuery = validateRequest(attendanceReportQuerySchema, 'query');