import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema(
  {
    pin: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true
    },
    shortPin: { 
      type: String, 
      required: true, 
      trim: true
    },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: false, trim: true, default: 'CME' },
    year: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    shift: { 
      type: String, 
      required: true, 
      enum: ['1st shift', '2nd shift'],
      trim: true 
    },
    status: { 
      type: String, 
      required: true, 
      enum: ['active', 'inactive'], 
      default: 'active' 
    }
  },
  { timestamps: true }
)

// Indexes for faster queries (pin index is already created by unique: true)
studentSchema.index({ department: 1, semester: 1, shift: 1 })
studentSchema.index({ department: 1, semester: 1, shift: 1, section: 1 })

export default mongoose.model('Student', studentSchema)
