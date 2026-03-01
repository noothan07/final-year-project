import express from 'express'

import { 
  getSummary, 
  getSubjectWiseSummary,
  getMonthlySummary,
  getWeeklySummary,
  getTodaySummary,
  getSubjectSummary,
  getAttendanceDistribution,
  getLowAttendanceStudents,
  getPeriodAnalysis
} from '../controllers/dashboardController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

// Existing endpoints
router.get('/summary', getSummary)
router.get('/subject-wise', getSubjectWiseSummary)

// New chart endpoints
router.get('/monthly-summary', getMonthlySummary)
router.get('/weekly-summary', getWeeklySummary)
router.get('/today-summary', getTodaySummary)
router.get('/subject-summary', getSubjectSummary)
router.get('/distribution', getAttendanceDistribution)
router.get('/low-attendance', getLowAttendanceStudents)
router.get('/period-analysis', getPeriodAnalysis)

export default router
