import express from 'express'

import { exportMonthlyExcel, getMonthlySummary, getWeeklyRegister, exportWeeklyExcel } from '../controllers/reportController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/monthly', getMonthlySummary)
router.get('/monthly/excel', exportMonthlyExcel)
router.get('/weekly-register', getWeeklyRegister)
router.get('/weekly-register/excel', exportWeeklyExcel)

export default router
