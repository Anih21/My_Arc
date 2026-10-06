import jwt from 'jsonwebtoken';

export function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function publicUser(user) {
  return {
    id:            user._id,
    username:      user.username,
    email:         user.email,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalXP:       user.totalXP,
    level:         user.level,
    perfectDays:   user.perfectDays,
    arcStartDate:  user.arcStartDate  || null,
    arcGoal:       user.arcGoal       || null,
  };
}
