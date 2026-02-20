import express from 'express'

import Faculty from '../models/Faculty.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Get all staff members (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const staff = await Faculty.find({ role: 'staff' }).select('-password').sort({ createdAt: -1 })
    res.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    res.status(500).json({ message: 'Error fetching staff' })
  }
})

// Register new staff member (admin only)
router.post('/register', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { employeeId, name, email, password, department } = req.body

    if (!employeeId || !name || !email || !password || !department) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    // Check if employee ID already exists
    const existingEmployeeId = await Faculty.findOne({ employeeId })
    if (existingEmployeeId) {
      return res.status(409).json({ message: 'Employee ID already exists' })
    }

    // Check if email already exists
    const existingEmail = await Faculty.findOne({ email: email.toLowerCase() })
    if (existingEmail) {
      return res.status(409).json({ message: 'Email already exists' })
    }

    const staff = await Faculty.create({
      employeeId,
      name,
      email: email.toLowerCase(),
      password,
      department,
      role: 'staff'
    })

    const staffResponse = staff.toObject()
    delete staffResponse.password

    res.status(201).json({
      message: 'Staff registered successfully',
      staff: staffResponse
    })
  } catch (error) {
    console.error('Error registering staff:', error)
    res.status(500).json({ message: 'Error registering staff' })
  }
})

// Delete staff member (admin only)
router.delete('/:employeeId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { employeeId } = req.params
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ message: 'Admin password is required for deletion' })
    }

    // Verify admin password
    const admin = await Faculty.findById(req.user.id)
    const isPasswordValid = await admin.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid admin password' })
    }

    const staff = await Faculty.findOneAndDelete({ employeeId, role: 'staff' })
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' })
    }

    res.json({ message: 'Staff member deleted successfully' })
  } catch (error) {
    console.error('Error deleting staff:', error)
    res.status(500).json({ message: 'Error deleting staff' })
  }
})

export default router
