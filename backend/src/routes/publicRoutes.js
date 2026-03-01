import express from 'express'

import { getStudentAttendance, exportStudentAttendance } from '../controllers/attendanceController.js'

const router = express.Router()

// Public routes for student attendance view (no authentication required)
router.get('/student/:pin', getStudentAttendance)
router.get('/student/:pin/excel', exportStudentAttendance)

export default router
