import mongoose from 'mongoose';

const arcCycleSchema = new mongoose.Schema(
  {
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cycleNumber: { type: Number, required: true },
    goal:        { type: String, default: 'Fitness' },
    startDate:   { type: String, required: true }, // YYYY-MM-DD
    endDate:     { type: String, required: true }, // YYYY-MM-DD (typically +29 days)
    status:      { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true }
);

arcCycleSchema.index({ userId: 1, cycleNumber: 1 }, { unique: true });

export default mongoose.model('ArcCycle', arcCycleSchema);
