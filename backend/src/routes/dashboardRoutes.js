import express from 'express'

import { getSummary } from '../controllers/dashboardController.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.use(requireAuth)

router.get('/summary', getSummary)

export default router
