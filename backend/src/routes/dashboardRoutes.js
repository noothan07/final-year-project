import express from 'express'

import { getSummary, getSubjectWiseSummary } from '../controllers/dashboardController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/summary', getSummary)
router.get('/subject-wise', getSubjectWiseSummary)

export default router
