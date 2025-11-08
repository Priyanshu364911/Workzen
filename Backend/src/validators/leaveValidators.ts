import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Leave application schema
export const applyLeaveSchema = Joi.object({
  type: Joi.string()
    .valid('Sick', 'Casual', 'Earned', 'Maternity', 'Paternity')
    .required()
    .messages({
      'any.only': 'Leave type must be one of: Sick, Casual, Earned, Maternity, Paternity',
      'any.required': 'Leave type is required'
    }),
  from: Joi.date()
    .required()
    .min('now')
    .messages({
      'any.required': 'From date is required',
      'date.min': 'From date cannot be in the past'
    }),
  to: Joi.date()
    .required()
    .min(Joi.ref('from'))
    .messages({
      'any.required': 'To date is required',
      'date.min': 'To date must be greater than or equal to from date'
    }),
  reason: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Reason must be at least 10 characters',
      'string.max': 'Reason cannot be more than 500 characters',
      'any.required': 'Reason is required'
    })
});

// Leave review schema (for approval/rejection)
export const reviewLeaveSchema = Joi.object({
  status: Joi.string()
    .valid('Approved', 'Rejected')
    .required()
    .messages({
      'any.only': 'Status must be either Approved or Rejected',
      'any.required': 'Status is required'
    }),
  reviewComments: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Review comments cannot be more than 500 characters'
    })
});

// Approve/Reject leave schema (for specific endpoints)
export const approveRejectLeaveSchema = Joi.object({
  reviewComments: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Review comments cannot be more than 500 characters'
    })
});

// Update leave schema (Admin/HR only)
export const updateLeaveSchema = Joi.object({
  type: Joi.string()
    .valid('Sick', 'Casual', 'Earned', 'Maternity', 'Paternity')
    .optional()
    .messages({
      'any.only': 'Leave type must be one of: Sick, Casual, Earned, Maternity, Paternity'
    }),
  from: Joi.date()
    .optional(),
  to: Joi.date()
    .optional()
    .when('from', {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref('from')),
      otherwise: Joi.date()
    })
    .messages({
      'date.min': 'To date must be greater than or equal to from date'
    }),
  reason: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .optional()
    .messages({
      'string.min': 'Reason must be at least 10 characters',
      'string.max': 'Reason cannot be more than 500 characters'
    }),
  status: Joi.string()
    .valid('Pending', 'Approved', 'Rejected')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Pending, Approved, Rejected'
    }),
  reviewComments: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Review comments cannot be more than 500 characters'
    })
});

// Leave query parameters schema
export const getLeaveQuerySchema = Joi.object({
  userId: Joi.string()
    .optional(),
  type: Joi.string()
    .valid('Sick', 'Casual', 'Earned', 'Maternity', 'Paternity')
    .optional()
    .messages({
      'any.only': 'Leave type must be one of: Sick, Casual, Earned, Maternity, Paternity'
    }),
  status: Joi.string()
    .valid('Pending', 'Approved', 'Rejected')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Pending, Approved, Rejected'
    }),
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
    .valid('appliedAt', 'from', 'to', 'status', 'type', 'createdAt')
    .default('appliedAt')
    .messages({
      'any.only': 'Sort by must be one of: appliedAt, from, to, status, type, createdAt'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
});

// Leave balance allocation schema (Admin/HR only)
export const allocateLeaveSchema = Joi.object({
  userId: Joi.string()
    .required()
    .messages({
      'any.required': 'User ID is required'
    }),
  year: Joi.number()
    .integer()
    .min(2020)
    .max(2050)
    .default(() => new Date().getFullYear())
    .messages({
      'number.integer': 'Year must be an integer',
      'number.min': 'Year must be 2020 or later',
      'number.max': 'Year cannot be more than 2050'
    }),
  sickLeave: Joi.number()
    .min(0)
    .max(365)
    .optional()
    .messages({
      'number.min': 'Sick leave cannot be negative',
      'number.max': 'Sick leave cannot exceed 365 days'
    }),
  casualLeave: Joi.number()
    .min(0)
    .max(365)
    .optional()
    .messages({
      'number.min': 'Casual leave cannot be negative',
      'number.max': 'Casual leave cannot exceed 365 days'
    }),
  earnedLeave: Joi.number()
    .min(0)
    .max(365)
    .optional()
    .messages({
      'number.min': 'Earned leave cannot be negative',
      'number.max': 'Earned leave cannot exceed 365 days'
    })
});

// Leave balance query schema
export const getLeaveBalanceQuerySchema = Joi.object({
  userId: Joi.string()
    .optional(),
  year: Joi.number()
    .integer()
    .min(2020)
    .max(2050)
    .default(() => new Date().getFullYear())
    .messages({
      'number.integer': 'Year must be an integer',
      'number.min': 'Year must be 2020 or later',
      'number.max': 'Year cannot be more than 2050'
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
export const validateApplyLeave = validateRequest(applyLeaveSchema);
export const validateReviewLeave = validateRequest(reviewLeaveSchema);
export const validateApproveRejectLeave = validateRequest(approveRejectLeaveSchema);
export const validateUpdateLeave = validateRequest(updateLeaveSchema);
export const validateGetLeaveQuery = validateRequest(getLeaveQuerySchema, 'query');
export const validateAllocateLeave = validateRequest(allocateLeaveSchema);
export const validateGetLeaveBalanceQuery = validateRequest(getLeaveBalanceQuerySchema, 'query');