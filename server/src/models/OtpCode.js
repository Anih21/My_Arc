import mongoose from 'mongoose';

// TTL index: MongoDB automatically deletes expired OTP documents
const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true, trim: true },
  code:      { type: String, required: true },
  attempts:  { type: Number, default: 0 },
  expiresAt: { type: Date,   required: true },
});

// MongoDB TTL — removes the document automatically after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// One pending OTP per email at a time
otpSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('OtpCode', otpSchema);
