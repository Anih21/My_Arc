# ❄️ Winter Arc

A gamified daily discipline tracker where users create their own tasks, check them off, earn a score out of 10, build streaks, gain XP and unlock achievements.

## Current build
- React + Vite frontend
- Express + MongoDB backend
- Mobile OTP registration flow (mock OTP in development: `123456`)
- JWT authentication + bcrypt password hashing
- Unlimited custom daily tasks
- Historical daily task snapshots
- Daily score /10 with emoji reactions
- XP, levels, streaks and perfect-day tracking
- Progress chart
- History view
- Achievement system
- Responsive dark winter theme

## Run locally

### Server
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```

Set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, and `APP_TIMEZONE` in `server/.env`.

For production, replace the mock OTP adapter in `server/src/services/otp.service.js` with MSG91, Twilio, Firebase, or another verified SMS provider.
