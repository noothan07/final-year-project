import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema(
  {
    rollNo: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

studentSchema.index({ department: 1, year: 1, section: 1, rollNo: 1 })

export default mongoose.model('Student', studentSchema)
