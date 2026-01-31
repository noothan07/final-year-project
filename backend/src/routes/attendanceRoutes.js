import express from 'express'

import { markAttendance } from '../controllers/attendanceController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.post('/mark', markAttendance)

export default router
