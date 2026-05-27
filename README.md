# WeChat Booking Mini-Program

[中文版](README_zh.md)

A WeChat Mini-Program booking system for FluffyIce Studio, a perler bead craft shop. Supports three booking types: hourly, all-day, and limited-board sessions.

## Booking Types

| Type | Description | Price |
|------|-------------|-------|
| Hourly | Custom start/end time, free grace period within 10 min | $11/hr |
| All-Day | Unlimited time for the whole day | $50 (weekday) / $55 (weekend) |
| Limited Board | Select arrival time, auto +3 hours, one 52×52 board | $30 |

## Business Hours

- Mon–Fri: 13:00 – 21:00
- Sat–Sun: 12:00 – 20:00
- Max capacity: 12 people

## Tech Stack

- **Frontend**: WeChat Mini-Program (WXML / WXSS / JS)
- **Backend**: Node.js + Express + MongoDB + JWT

## Project Structure

```
miniprogram/          # Mini-program frontend
├── pages/
│   ├── home/         # Home page
│   ├── booking/      # Booking page
│   ├── myBookings/   # My bookings
│   ├── admin/        # Admin panel
│   └── success/      # Booking success page
├── utils/            # Utilities (API, date, mock, validation)
└── assets/           # Images

server/               # Backend service
└── src/
    ├── models/       # Data models (User, Reservation, TimeSlot, StoreSettings)
    ├── routes/       # API routes (auth, reservations, timeslots, admin)
    ├── middleware/    # JWT auth middleware
    └── seeds/        # Database seeding
```

## Getting Started

### Backend

```bash
cd server
cp .env.example .env   # Configure environment variables
npm install
npm start
```

### Frontend

1. Open the project root with [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. AppID: `wx9c4c06d01b11855f`
3. Mock mode is enabled by default — no backend needed for preview

## License

MIT
