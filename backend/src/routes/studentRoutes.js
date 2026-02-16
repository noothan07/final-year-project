import express from 'express'

import { createStudent, getStudents, getStudentAttendance, getMonthlyReport, deleteStudent } from '../controllers/studentController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', getStudents)
router.post('/', createStudent)
router.delete('/:pin', deleteStudent)
router.get('/attendance/:pin', getStudentAttendance)
router.get('/monthly-report/:pin', getMonthlyReport)

export default router
