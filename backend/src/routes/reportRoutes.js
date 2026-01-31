import express from 'express'

import { exportMonthlyExcel, getMonthlySummary } from '../controllers/reportController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/monthly', getMonthlySummary)
router.get('/monthly/export', exportMonthlyExcel)

export default router
