import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username:      { type: String, required: true, unique: true, trim: true, minlength: 3 },
    email:         { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash:  { type: String, required: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalXP:       { type: Number, default: 0 },
    level:         { type: Number, default: 1 },
    perfectDays:   { type: Number, default: 0 },
    arcStartDate:  { type: String, default: null },
    arcGoal:       { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
