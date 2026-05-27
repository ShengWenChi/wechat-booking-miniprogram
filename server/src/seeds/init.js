// server/src/seeds/init.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const TimeSlot = require('../models/TimeSlot');
const StoreSettings = require('../models/StoreSettings');

const defaultSlots = [
  { startTime: '13:00', endTime: '15:00', maxPeople: 8, sortOrder: 1 },
  { startTime: '15:00', endTime: '17:00', maxPeople: 8, sortOrder: 2 },
  { startTime: '17:00', endTime: '19:00', maxPeople: 8, sortOrder: 3 },
  { startTime: '19:00', endTime: '21:00', maxPeople: 8, sortOrder: 4 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/perler_beads');
  console.log('DB connected');

  for (const slot of defaultSlots) {
    const exists = await TimeSlot.findOne({ startTime: slot.startTime });
    if (!exists) {
      await TimeSlot.create(slot);
      console.log(`Created slot: ${slot.startTime}-${slot.endTime}`);
    }
  }

  const exists = await StoreSettings.findOne({ key: 'main' });
  if (!exists) {
    await StoreSettings.create({
      key: 'main',
      storeName: 'FluffyIce Studio',
      storeDesc: 'Craft your own Perler bead masterpiece!',
      storeAddress: '9111 Beckwith Rd, Unit 2030',
      businessHours: '1:00 PM – 9:00 PM',
      cancelDeadlineHours: 2,
      advanceBookingDays: 14,
    });
    console.log('Store settings created');
  }

  console.log('Seed completed!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
