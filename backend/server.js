import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import { connectDb } from './src/config/db.js'
import authRoutes from './src/routes/authRoutes.js'
import studentRoutes from './src/routes/studentRoutes.js'
import attendanceRoutes from './src/routes/attendanceRoutes.js'
import reportRoutes from './src/routes/reportRoutes.js'
import dashboardRoutes from './src/routes/dashboardRoutes.js'

dotenv.config({ override: true })

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/dashboard', dashboardRoutes)

const PORT = process.env.PORT || 5000

async function start() {
  // Skip database connection in mock mode
  if (process.env.MOCK_MODE !== 'true') {
    await connectDb(process.env.MONGODB_URI)
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    if (process.env.MOCK_MODE === 'true') {
      console.log('🧪 MOCK MODE: Database operations are simulated')
    }
  })
}

start().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
