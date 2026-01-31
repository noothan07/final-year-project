import express from 'express'

import { createStudent, getStudents } from '../controllers/studentController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', getStudents)
router.post('/', createStudent)

export default router
