import express from 'express'

import { markAttendance, getAttendanceSummary, getClassAttendance, getStudentAttendance, exportStudentAttendance } from '../controllers/attendanceController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.post('/mark', markAttendance)
router.get('/summary', getAttendanceSummary)
router.get('/class', getClassAttendance)
router.get('/student/:pin', getStudentAttendance)
router.get('/student/:pin/excel', exportStudentAttendance)

export default router
