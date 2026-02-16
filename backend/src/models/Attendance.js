import mongoose from 'mongoose'

const periodAttendanceSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  shift: {
    type: String,
    required: true,
    enum: ['1st shift', '2nd shift'],
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  date: {
    type: Date,
    required: true
  },
  absentees: [{
    type: String,
    trim: true
  }],
  presents: [{
    type: String,
    trim: true
  }],
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: false
  }
}, {
  timestamps: true
})

// Compound unique index to prevent duplicate attendance marking
periodAttendanceSchema.index(
  { department: 1, semester: 1, shift: 1, subject: 1, period: 1, date: 1 },
  { unique: true }
)

// Additional indexes for faster queries
periodAttendanceSchema.index({ date: 1 })
periodAttendanceSchema.index({ department: 1, semester: 1, shift: 1 })
periodAttendanceSchema.index({ markedBy: 1 })

export default mongoose.model('PeriodAttendance', periodAttendanceSchema)
