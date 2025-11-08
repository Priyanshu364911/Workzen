import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Validation schemas
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
});

export const registerSchema = Joi.object({
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
    .messages({
      'string.max': 'Department cannot be more than 50 characters'
    }),
  position: Joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.max': 'Position cannot be more than 50 characters'
    }),
  joinDate: Joi.date()
    .optional()
    .default(new Date())
});

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot be more than 100 characters'
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
    })
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'string.max': 'New password cannot be more than 128 characters',
      'any.required': 'New password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Password confirmation does not match new password',
      'any.required': 'Password confirmation is required'
    })
});

// Validation middleware factory
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join('. ');
      
      return next(new AppError(errorMessage, 400));
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Specific validation middlewares
export const validateLogin = validateRequest(loginSchema);
export const validateRegister = validateRequest(registerSchema);
export const validateUpdateProfile = validateRequest(updateProfileSchema);
export const validateChangePassword = validateRequest(changePasswordSchema);