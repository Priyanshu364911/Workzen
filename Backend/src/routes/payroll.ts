import { Router } from 'express';
import PayrollController from '../controllers/payrollController';
import { authenticate, restrictTo } from '../middleware/auth';
import {
  validateProcessPayroll,
  validateUpdateSalary,
  validateUpdatePayroll,
  validateGetPayrollQuery,
  validatePayrollReportQuery
} from '../validators/payrollValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee routes (can view own payslips)
router.get('/payslips', validateGetPayrollQuery, PayrollController.getPayslips);

// Get payroll records (filtered by role)
router.get('/', validateGetPayrollQuery, PayrollController.getPayroll);

// Get specific payroll record
router.get('/:id', PayrollController.getPayrollById);

// Get user payroll history (Admin/Payroll Officer or own records)
router.get('/user/:userId/history', PayrollController.getUserPayrollHistory);

// Admin/Payroll Officer routes
router.post('/process', restrictTo('Admin', 'Payroll Officer'), validateProcessPayroll, PayrollController.processPayroll);
router.post('/preview', restrictTo('Admin', 'Payroll Officer'), validateProcessPayroll, PayrollController.calculatePreview);
router.put('/:id', restrictTo('Admin', 'Payroll Officer'), validateUpdatePayroll, PayrollController.updatePayroll);
router.put('/salary/:userId', restrictTo('Admin', 'Payroll Officer'), validateUpdateSalary, PayrollController.updateUserSalary);
router.get('/month/:month', restrictTo('Admin', 'Payroll Officer'), PayrollController.getPayrollByMonth);
router.get('/reports/generate', restrictTo('Admin', 'Payroll Officer'), validatePayrollReportQuery, PayrollController.generateReport);
router.get('/reports/stats', restrictTo('Admin', 'Payroll Officer'), PayrollController.getStats);

// Admin only routes
router.delete('/:id', restrictTo('Admin'), PayrollController.deletePayroll);

export default router;