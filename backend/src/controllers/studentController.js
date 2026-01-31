import Student from '../models/Student.js'

export async function createStudent(req, res) {
  const { rollNo, name, department, year, section } = req.body || {}

  if (!rollNo || !name || !department || !year || !section) {
    return res.status(400).json({ message: 'rollNo, name, department, year, section are required' })
  }

  // Mock mode: skip database and return a fake student
  if (process.env.MOCK_MODE === 'true') {
    return res.status(201).json({
      student: {
        _id: 'mock_student_id',
        rollNo: String(rollNo).trim(),
        name,
        department,
        year,
        section,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  }

  const existing = await Student.findOne({ rollNo: String(rollNo).trim() })
  if (existing) {
    return res.status(409).json({ message: 'Roll number already exists' })
  }

  const student = await Student.create({ rollNo, name, department, year, section })
  return res.status(201).json({ student })
}

export async function getStudents(req, res) {
  const { department, year, section } = req.query || {}

  // Mock mode: return fake students
  if (process.env.MOCK_MODE === 'true') {
    const mockStudents = [
      { _id: '1', rollNo: '101', name: 'Alice Johnson', department: 'CS', year: '3', section: 'A' },
      { _id: '2', rollNo: '102', name: 'Bob Smith', department: 'CS', year: '3', section: 'A' },
      { _id: '3', rollNo: '103', name: 'Charlie Brown', department: 'CS', year: '3', section: 'A' },
      { _id: '4', rollNo: '104', name: 'Diana Prince', department: 'CS', year: '3', section: 'A' },
      { _id: '5', rollNo: '105', name: 'Edward Norton', department: 'CS', year: '3', section: 'A' }
    ]
    return res.json({ students: mockStudents })
  }

  const filter = {}
  if (department) filter.department = department
  if (year) filter.year = year
  if (section) filter.section = section

  const students = await Student.find(filter).sort({ rollNo: 1 })
  return res.json({ students })
}
