import express from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { resumeUpload, docUpload } from '../middleware/upload.js';

import authController from '../controllers/authController.js';
import studentController from '../controllers/studentController.js';
import companyController from '../controllers/companyController.js';
import driveController from '../controllers/driveController.js';
import applicationController from '../controllers/applicationController.js';
import assessmentController from '../controllers/assessmentController.js';
import analyticsController from '../controllers/analyticsController.js';
import uploadController from '../controllers/uploadController.js';
import resumeCheckerController from '../controllers/resumeCheckerController.js';
import atsCheckerController from '../controllers/atsCheckerController.js';
import aiInterviewController from '../controllers/aiInterviewController.js';
import mockInterviewController from '../controllers/mockInterviewController.js';

const router = express.Router();

// ---------------- AUTHENTICATION ----------------
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/reset-password', authController.resetPassword);

// ---------------- USER PROFILE ----------------
router.get('/users/profile', authenticate, authController.getProfile);

// ---------------- STUDENTS ----------------
router.get('/students', authenticate, authorizeRoles('organization'), studentController.getStudents);
router.get('/students/:id', authenticate, studentController.getStudentById);
router.put('/students/:id', authenticate, studentController.updateStudent);

// ---------------- COMPANIES ----------------
router.get('/companies', authenticate, companyController.getCompanies);
router.post('/companies', authenticate, authorizeRoles('organization'), companyController.createCompany);
router.put('/companies/:id', authenticate, authorizeRoles('organization'), companyController.updateCompany);
router.delete('/companies/:id', authenticate, authorizeRoles('organization'), companyController.deleteCompany);

// ---------------- PLACEMENT DRIVES ----------------
router.get('/drives', authenticate, driveController.getDrives);
router.get('/drives/:id', authenticate, driveController.getDriveById);
router.post('/drives', authenticate, authorizeRoles('organization'), driveController.createDrive);
router.put('/drives/:id', authenticate, authorizeRoles('organization'), driveController.updateDrive);
router.delete('/drives/:id', authenticate, authorizeRoles('organization'), driveController.deleteDrive);
router.post('/drives/:id/apply', authenticate, authorizeRoles('user'), driveController.applyDrive);
router.get('/drives/:id/export', authenticate, authorizeRoles('organization'), driveController.exportDriveApplicants);
router.post('/drives/parse-jd', authenticate, authorizeRoles('organization'), driveController.parseJd);

// ---------------- APPLICATIONS ----------------
router.get('/applications', authenticate, applicationController.getApplications);
router.patch(
  '/applications/:id/status',
  authenticate,
  authorizeRoles('organization'),
  applicationController.updateApplicationStatus
);

// ---------------- ASSESSMENTS & TRAINING ----------------
router.get('/assessments', authenticate, assessmentController.getAssessments);
router.post(
  '/assessments',
  authenticate,
  authorizeRoles('organization'),
  assessmentController.saveAssessment
);

// ---------------- ANALYTICS ----------------
router.get('/analytics/summary', authenticate, authorizeRoles('organization'), analyticsController.getSummary);

// ---------------- RESUME CHECKER & AUDIT ----------------
router.post(
  '/resume-checker/analyze',
  authenticate,
  (req, res, next) => {
    docUpload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  resumeCheckerController.analyzeResume
);
router.get('/resume-checker/history', authenticate, resumeCheckerController.getAuditHistory);

// ---------------- ATS SCORE CHECKER ----------------
router.post(
  '/ats-checker/score',
  authenticate,
  (req, res, next) => {
    docUpload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  atsCheckerController.scoreAts
);
router.get('/ats-checker/history', authenticate, atsCheckerController.getAtsHistory);

// ---------------- AI INTERVIEW SIMULATOR ----------------
router.post('/ai-interview/start', authenticate, authorizeRoles('user'), aiInterviewController.startInterviewSession);
router.post('/ai-interview/:sessionId/answer', authenticate, authorizeRoles('user'), aiInterviewController.submitQuestionAnswer);
router.post('/ai-interview/:sessionId/finish', authenticate, authorizeRoles('user'), aiInterviewController.finishInterviewSession);
router.get('/ai-interview/history', authenticate, aiInterviewController.getInterviewHistory);
router.get('/ai-interview/:sessionId', authenticate, aiInterviewController.getInterviewSessionById);

// ---------------- MOCK INTERVIEW MANAGER ----------------
router.get('/mock-interviews/slots', authenticate, mockInterviewController.getSlots);
router.post('/mock-interviews/slots', authenticate, authorizeRoles('organization'), mockInterviewController.createSlot);
router.put('/mock-interviews/slots/:id', authenticate, authorizeRoles('organization'), mockInterviewController.updateSlot);
router.delete('/mock-interviews/slots/:id', authenticate, authorizeRoles('organization'), mockInterviewController.deleteSlot);
router.post('/mock-interviews/slots/:id/book', authenticate, authorizeRoles('user'), mockInterviewController.bookSlot);
router.delete('/mock-interviews/slots/:id/cancel-booking', authenticate, authorizeRoles('user'), mockInterviewController.cancelBooking);
router.get('/mock-interviews/my-bookings', authenticate, authorizeRoles('user'), mockInterviewController.getMyBookings);
router.get('/mock-interviews/all-bookings', authenticate, authorizeRoles('organization'), mockInterviewController.getAllBookings);
router.post('/mock-interviews/bookings/:id/evaluate', authenticate, authorizeRoles('organization'), mockInterviewController.evaluateBooking);

// ---------------- FILE UPLOAD ----------------
router.post(
  '/uploads/resume',
  authenticate,
  (req, res, next) => {
    resumeUpload.single('resume')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  uploadController.uploadResume
);

export default router;
