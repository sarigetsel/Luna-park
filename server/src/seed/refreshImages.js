require('dotenv').config();
const connectDB = require('../config/db');
const Ride = require('../models/Ride');
const Coupon = require('../models/Coupon');
const { downloadImage } = require('./downloadMedia');
const { rideSeeds, couponSeeds } = require('./seedData');

async function refreshImages() {
  await connectDB();

  for (const seed of rideSeeds) {
    const ride = await Ride.findOne({ name: seed.name });
    if (!ride) continue;
    try {
      const imageUrl = await downloadImage(seed.imageSource, seed.imageFile, true);
      ride.imageUrl = imageUrl;
      await ride.save();
      console.log(`Updated image for ride: ${seed.name}`);
    } catch (err) {
      ride.imageUrl = seed.imageSource;
      await ride.save();
      console.warn(`Fallback URL for ride ${seed.name}:`, err.message);
    }
  }

  for (const seed of couponSeeds) {
    const coupon = await Coupon.findOne({ code: seed.code });
    if (!coupon) continue;
    try {
      const imageUrl = await downloadImage(seed.imageSource, seed.imageFile, true);
      coupon.imageUrl = imageUrl;
      await coupon.save();
      console.log(`Updated image for coupon: ${seed.code}`);
    } catch (err) {
      coupon.imageUrl = seed.imageSource;
      await coupon.save();
      console.warn(`Fallback URL for coupon ${seed.code}:`, err.message);
    }
  }

  console.log('Image refresh complete');
  process.exit(0);
}

refreshImages().catch((err) => {
  console.error(err);
  process.exit(1);
});
