import { Router } from 'express';
import AttendanceController from '../controllers/attendanceController';
import { authenticate, restrictTo } from '../middleware/auth';
import {
  validateCheckIn,
  validateCheckOut,
  validateManualAttendance,
  validateUpdateAttendance,
  validateGetAttendanceQuery,
  validateAttendanceReportQuery
} from '../validators/attendanceValidators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee routes (accessible to all authenticated users)
router.post('/checkin', validateCheckIn, AttendanceController.checkIn);
router.post('/checkout', validateCheckOut, AttendanceController.checkOut);
router.get('/status', AttendanceController.getCurrentStatus);
router.get('/summary', AttendanceController.getUserSummary);

// Get attendance logs (filtered by role)
router.get('/logs', validateGetAttendanceQuery, AttendanceController.getAttendance);

// Get specific attendance record
router.get('/:id', AttendanceController.getAttendanceById);

// Get attendance for specific user (Admin/HR or own records)
router.get('/user/:userId', validateGetAttendanceQuery, AttendanceController.getUserAttendance);

// Admin/HR only routes
router.post('/manual', restrictTo('Admin', 'HR Officer'), validateManualAttendance, AttendanceController.createManualAttendance);
router.put('/:id', restrictTo('Admin', 'HR Officer'), validateUpdateAttendance, AttendanceController.updateAttendance);
router.get('/reports/generate', restrictTo('Admin', 'HR Officer'), validateAttendanceReportQuery, AttendanceController.generateReport);
router.get('/reports/stats', restrictTo('Admin', 'HR Officer'), AttendanceController.getStats);

// Admin only routes
router.delete('/:id', restrictTo('Admin'), AttendanceController.deleteAttendance);

export default router;