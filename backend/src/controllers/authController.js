import jwt from 'jsonwebtoken'

import Faculty from '../models/Faculty.js'

function signToken(faculty) {
  return jwt.sign(
    { id: faculty._id.toString(), email: faculty.email, role: faculty.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export async function register(req, res) {
  const { name, email, password, role } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' })
  }

  // Mock mode: skip database and return a fake user
  if (process.env.MOCK_MODE === 'true') {
    const token = jwt.sign(
      { id: 'mock_user_id', email: String(email).toLowerCase(), role: role || 'faculty' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    return res.status(201).json({
      token,
      faculty: { id: 'mock_user_id', name, email, role: role || 'faculty' },
    })
  }

  const existing = await Faculty.findOne({ email: String(email).toLowerCase() })
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' })
  }

  const faculty = await Faculty.create({ name, email, password, role: role || 'faculty' })
  const token = signToken(faculty)

  return res.status(201).json({
    token,
    faculty: { id: faculty._id, name: faculty.name, email: faculty.email, role: faculty.role },
  })
}

export async function login(req, res) {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  console.log('🔍 Login attempt:', { email: String(email).toLowerCase() })

  const faculty = await Faculty.findOne({ email: String(email).toLowerCase() })
  if (!faculty) {
    console.log('❌ Faculty not found for email:', String(email).toLowerCase())
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  console.log('✅ Faculty found:', { id: faculty._id, email: faculty.email })

  const ok = await faculty.comparePassword(password)
  if (!ok) {
    console.log('❌ Password comparison failed')
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  console.log('✅ Login successful for:', faculty.email)

  const token = signToken(faculty)
  return res.json({
    token,
    faculty: { id: faculty._id, name: faculty.name, email: faculty.email, role: faculty.role },
  })
}

export async function me(req, res) {
  // Mock mode: skip database and return a fake user
  if (process.env.MOCK_MODE === 'true') {
    return res.json({
      faculty: { id: 'mock_user_id', name: 'Mock Faculty', email: 'mock@example.com', role: 'faculty' }
    })
  }

  const faculty = await Faculty.findById(req.user?.id).select('-password')
  if (!faculty) {
    return res.status(404).json({ message: 'Faculty not found' })
  }
  return res.json({ faculty })
}
