import { Router } from 'express';
import UserController from '../controllers/userController';
import { authenticate, restrictTo } from '../middleware/auth';
import {
  validateCreateUser,
  validateUpdateUser,
  validateGetUsersQuery
} from '../validators/userValidators';
import Joi from 'joi';
import { validateRequest } from '../validators/userValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Search users (accessible to all authenticated users)
router.get('/search', UserController.searchUsers);

// Get user statistics (Admin/HR only)
router.get('/stats', restrictTo('Admin', 'HR Officer'), UserController.getUserStats);

// Get users by role (Admin/HR only)
router.get('/role/:role', restrictTo('Admin', 'HR Officer'), UserController.getUsersByRole);

// Get users by department (Admin/HR only)
router.get('/department/:department', restrictTo('Admin', 'HR Officer'), UserController.getUsersByDepartment);

// Get all users with pagination and filtering (Admin/HR only)
router.get('/', restrictTo('Admin', 'HR Officer'), validateGetUsersQuery, UserController.getUsers);

// Create new user (Admin only)
router.post('/', restrictTo('Admin'), validateCreateUser, UserController.createUser);

// Get user by ID (Admin/HR can see all, others can see own profile)
router.get('/:id', UserController.getUserById);

// Update user (Admin/HR only)
router.put('/:id', restrictTo('Admin', 'HR Officer'), validateUpdateUser, UserController.updateUser);

// Delete user (Admin only)
router.delete('/:id', restrictTo('Admin'), UserController.deleteUser);

// Deactivate user (Admin only)
router.put('/:id/deactivate', restrictTo('Admin'), UserController.deactivateUser);

// Activate user (Admin only)
router.put('/:id/activate', restrictTo('Admin'), UserController.activateUser);

// Update user salary (Admin/Payroll Officer only)
const salaryUpdateSchema = Joi.object({
  basicSalary: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Basic salary must be a positive number',
      'any.required': 'Basic salary is required'
    })
});

router.put(
  '/:id/salary',
  restrictTo('Admin', 'Payroll Officer'),
  validateRequest(salaryUpdateSchema),
  UserController.updateUserSalary
);

export default router;