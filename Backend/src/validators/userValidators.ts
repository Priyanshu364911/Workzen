import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// User creation schema (Admin only)
export const createUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot be more than 100 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot be more than 128 characters',
      'any.required': 'Password is required'
    }),
  role: Joi.string()
    .valid('Admin', 'HR Officer', 'Payroll Officer', 'Employee')
    .default('Employee')
    .messages({
      'any.only': 'Role must be one of: Admin, HR Officer, Payroll Officer, Employee'
    }),
  basicSalary: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Basic salary must be a positive number',
      'any.required': 'Basic salary is required'
    }),
  department: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Department cannot be more than 50 characters'
    }),
  position: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Position cannot be more than 50 characters'
    }),
  joinDate: Joi.date()
    .optional()
    .default(new Date())
});

// User update schema (Admin/HR)
export const updateUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot be more than 100 characters'
    }),
  role: Joi.string()
    .valid('Admin', 'HR Officer', 'Payroll Officer', 'Employee')
    .optional()
    .messages({
      'any.only': 'Role must be one of: Admin, HR Officer, Payroll Officer, Employee'
    }),
  basicSalary: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.positive': 'Basic salary must be a positive number'
    }),
  department: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Department cannot be more than 50 characters'
    }),
  position: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Position cannot be more than 50 characters'
    }),
  isActive: Joi.boolean()
    .optional()
});

// User query parameters schema
export const getUsersQuerySchema = Joi.object({
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
  search: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Search term cannot be more than 100 characters'
    }),
  role: Joi.string()
    .valid('Admin', 'HR Officer', 'Payroll Officer', 'Employee')
    .optional()
    .messages({
      'any.only': 'Role must be one of: Admin, HR Officer, Payroll Officer, Employee'
    }),
  department: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Department cannot be more than 50 characters'
    }),
  isActive: Joi.boolean()
    .optional(),
  sortBy: Joi.string()
    .valid('name', 'email', 'role', 'department', 'joinDate', 'createdAt')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: name, email, role, department, joinDate, createdAt'
    }),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
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
export const validateCreateUser = validateRequest(createUserSchema);
export const validateUpdateUser = validateRequest(updateUserSchema);
export const validateGetUsersQuery = validateRequest(getUsersQuerySchema, 'query');