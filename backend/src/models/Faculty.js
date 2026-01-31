import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const facultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: 'faculty' },
  },
  { timestamps: true }
)

facultySchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

facultySchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

export default mongoose.model('Faculty', facultySchema)
