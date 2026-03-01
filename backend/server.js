import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

import { connectDb } from './src/config/db.js'
import authRoutes from './src/routes/authRoutes.js'
import studentRoutes from './src/routes/studentRoutes.js'
import attendanceRoutes from './src/routes/attendanceRoutes.js'
import reportRoutes from './src/routes/reportRoutes.js'
import dashboardRoutes from './src/routes/dashboardRoutes.js'
import staffRoutes from './src/routes/staffRoutes.js'
import publicRoutes from './src/routes/publicRoutes.js'

dotenv.config({ override: true })

const app = express()

const allowedOrigins = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:4173']
app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      // For development, allow localhost origins
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Allowing development origin: ${origin}`)
        callback(null, true)
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`))
      }
    }
  }, 
  credentials: true 
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/public', publicRoutes)

const PORT = process.env.PORT || 5000

async function start() {
  await connectDb(process.env.MONGODB_URI)
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
