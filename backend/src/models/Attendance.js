import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema(
  {
    rollNo: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    subject: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ['Present', 'Absent'] },
  },
  { timestamps: true }
)

attendanceSchema.index({ rollNo: 1, date: 1, subject: 1 }, { unique: true })

export default mongoose.model('Attendance', attendanceSchema)
