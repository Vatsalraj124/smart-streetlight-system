import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import {
  createReport,
  getAllReports,
  getReport,
  updateReport,
  deleteReport,
  getNearbyReports,
  getReportStats,
  uploadReportImages
} from '../controllers/report.controller.js';
import { cloudinaryUpload } from '../utils/imageUpload.utils.js';
import { validateReport } from '../middleware/report.middleware.js';

const router = express.Router();

// Public routes
router.get('/nearby', getNearbyReports);

// Protected routes (all routes after this require authentication)
router.use(protect);

// Upload middleware for multiple images
const upload = cloudinaryUpload.array('images', 5); // Max 5 images

// Report routes
router.route('/')
  .get(getAllReports)
  .post(
    upload,
    validateReport,
    createReport
  );

router.route('/stats')
  .get(restrictTo('admin'), getReportStats);

router.route('/:id')
  .get(getReport)
  .patch(updateReport)
  .delete(restrictTo('admin'), deleteReport);

router.route('/:id/images')
  .post(upload, uploadReportImages);

export default router;