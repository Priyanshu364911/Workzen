import { Router } from 'express';
import LeaveController from '../controllers/leaveController';
import { authenticate, restrictTo } from '../middleware/auth';
import {
  validateApplyLeave,
  validateReviewLeave,
  validateUpdateLeave,
  validateGetLeaveQuery,
  validateAllocateLeave,
  validateGetLeaveBalanceQuery
} from '../validators/leaveValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee routes (accessible to all authenticated users)
router.post('/apply', validateApplyLeave, LeaveController.applyLeave);
router.get('/balance', validateGetLeaveBalanceQuery, LeaveController.getLeaveBalance);
router.get('/summary', LeaveController.getUserLeaveSummary);

// Get leave applications (filtered by role)
router.get('/', validateGetLeaveQuery, LeaveController.getLeaves);

// Get specific leave application
router.get('/:id', LeaveController.getLeaveById);

// Get leaves for specific user (Admin/HR/Payroll or own records)
router.get('/user/:userId', validateGetLeaveQuery, LeaveController.getUserLeaves);

// Delete leave (Admin can delete any, others can delete own pending)
router.delete('/:id', LeaveController.deleteLeave);

// Payroll Officer routes (can approve/reject leaves)
router.put('/:id/approve', restrictTo('Admin', 'Payroll Officer'), validateReviewLeave, LeaveController.approveLeave);
router.put('/:id/reject', restrictTo('Admin', 'Payroll Officer'), validateReviewLeave, LeaveController.rejectLeave);
router.get('/pending/list', restrictTo('Admin', 'HR Officer', 'Payroll Officer'), LeaveController.getPendingLeaves);

// Admin/HR only routes
router.put('/:id', restrictTo('Admin', 'HR Officer'), validateUpdateLeave, LeaveController.updateLeave);
router.post('/allocate', restrictTo('Admin', 'HR Officer'), validateAllocateLeave, LeaveController.allocateLeaveBalance);
router.get('/reports/stats', restrictTo('Admin', 'HR Officer'), LeaveController.getLeaveStats);

export default router;