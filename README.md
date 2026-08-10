# Hirai Wheel Alignment Center — V2 MERN Starter

## What is included
- React frontend
- Express + Node backend
- MongoDB/Mongoose models
- Customer + vehicle service records
- Automatic next alignment check at current KM + 5,000
- 4-month backup reminder date
- Reminder dashboard
- WhatsApp pre-filled message button

## Run
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

Set `MONGO_URI` in `server/.env`.

This version uses a WhatsApp click-to-chat link. Fully automatic WhatsApp API sending should be added after the core system is tested.
