import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Process payroll schema
export const processPayrollSchema = Joi.object({
  month: Joi.string()
    .required()
    .pattern(/^\d{4}-\d{2}$/)
    .messages({
      'any.required': 'Month is required',
      'string.pattern.base': 'Month must be in YYYY-MM format'
    }),
  userIds: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': 'User IDs must be an array'
    }),
  workingDays: Joi.number()
    .integer()
    .min(1)
    .max(31)
    .default(22)
    .messages({
      'number.integer': 'Working days must be an integer',
      'number.min': 'Working days must be at least 1',
      'number.max': 'Working days cannot exceed 31'
    })
});

// Update salary schema
export const updateSalarySchema = Joi.object({
  basicSalary: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Basic salary must be a positive number',
      'any.required': 'Basic salary is required'
    })
});

// Update payroll schema
export const updatePayrollSchema = Joi.object({
  basic: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Basic salary cannot be negative'
    }),
  hra: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'HRA cannot be negative'
    }),
  pf: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'PF deduction cannot be negative'
    }),
  proTax: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Professional tax cannot be negative'
    }),
  lop: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'LOP cannot be negative'
    }),
  workingDays: Joi.number()
    .integer()
    .min(1)
    .max(31)
    .optional()
    .messages({
      'number.integer': 'Working days must be an integer',
      'number.min': 'Working days must be at least 1',
      'number.max': 'Working days cannot exceed 31'
    }),
  presentDays: Joi.number()
    .integer()
    .min(0)
    .max(31)
    .optional()
    .messages({
      'number.integer': 'Present days must be an integer',
      'number.min': 'Present days cannot be negative',
      'number.max': 'Present days cannot exceed 31'
    }),
  paidLeaveDays: Joi.number()
    .integer()
    .min(0)
    .max(31)
    .optional()
    .messages({
      'number.integer': 'Paid leave days must be an integer',
      'number.min': 'Paid leave days cannot be negative',
      'number.max': 'Paid leave days cannot exceed 31'
    }),
  status: Joi.string()
    .valid('Draft', 'Processed', 'Paid')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Draft, Processed, Paid'
    })
});

// Payroll query parameters schema
export const getPayrollQuerySchema = Joi.object({
  month: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Month must be in YYYY-MM format'
    }),
  userId: Joi.string()
    .optional(),
  status: Joi.string()
    .valid('Draft', 'Processed', 'Paid')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Draft, Processed, Paid'
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
    .valid('month', 'netPay', 'grossPay', 'status', 'processedAt', 'createdAt')
    .default('month')
    .messages({
      'any.only': 'Sort by must be one of: month, netPay, grossPay, status, processedAt, createdAt'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
});

// Payroll report query schema
export const payrollReportQuerySchema = Joi.object({
  startMonth: Joi.string()
    .required()
    .pattern(/^\d{4}-\d{2}$/)
    .messages({
      'any.required': 'Start month is required',
      'string.pattern.base': 'Start month must be in YYYY-MM format'
    }),
  endMonth: Joi.string()
    .required()
    .pattern(/^\d{4}-\d{2}$/)
    .messages({
      'any.required': 'End month is required',
      'string.pattern.base': 'End month must be in YYYY-MM format'
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
    .valid('Draft', 'Processed', 'Paid')
    .optional()
    .messages({
      'any.only': 'Status must be one of: Draft, Processed, Paid'
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
export const validateProcessPayroll = validateRequest(processPayrollSchema);
export const validateUpdateSalary = validateRequest(updateSalarySchema);
export const validateUpdatePayroll = validateRequest(updatePayrollSchema);
export const validateGetPayrollQuery = validateRequest(getPayrollQuerySchema, 'query');
export const validatePayrollReportQuery = validateRequest(payrollReportQuerySchema, 'query');