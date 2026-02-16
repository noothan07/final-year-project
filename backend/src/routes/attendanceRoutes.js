import express from 'express'

import { markAttendance, getAttendanceSummary, getClassAttendance } from '../controllers/attendanceController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.post('/mark', markAttendance)
router.get('/summary', getAttendanceSummary)
router.get('/class', getClassAttendance)

export default router
