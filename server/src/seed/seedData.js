const Ride = require('../models/Ride');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { adminName, adminEmail, adminPassword } = require('../config/env');
const { downloadImage } = require('./downloadMedia');

const rideSeeds = [
  {
    name: 'גלגל הענק לונה',
    description: 'גלגל ענק מרהיב עם נוף פנורמי על כל הפארק — חוויה מושלמת לכל המשפחה.',
    capacity: 24,
    minimumHeight: 120,
    category: 'family',
    price: 30,
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    imageFile: 'ferris-wheel.jpg',
  },
  {
    name: 'רכבת ההרים אדרנלין',
    description: 'רכבת הרים מהירה עם לולאות וירידות תלולות — למחפשי הריגושים.',
    capacity: 16,
    minimumHeight: 140,
    category: 'thrill',
    price: 45,
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1517649763961-0c62306601b7?w=800&q=80',
    imageFile: 'roller-coaster.jpg',
  },
  {
    name: 'קרוסלת הכוכבים',
    description: 'קרוסלה קלאסית מעוטרת באורות צבעוניים — מתאימה לכל הגילאים.',
    capacity: 40,
    minimumHeight: 90,
    category: 'kids',
    price: 20,
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1529553268-fe9c6aeab427?w=800&q=80',
    imageFile: 'carousel.jpg',
  },
  {
    name: 'מגלשת המים הכחולה',
    description: 'מגלשת מים ארוכה עם מתזים ובריכה — הדרך המושלמת להתקרר בקיץ.',
    capacity: 2,
    minimumHeight: 110,
    category: 'water',
    price: 35,
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80',
    imageFile: 'water-slide.jpg',
  },
  {
    name: 'בית האימה לילי',
    description: 'חוויה מפחידה עם אפקטים מיוחדים ותאורה דרמטית — לא לחלשי לב.',
    capacity: 8,
    minimumHeight: 130,
    category: 'thrill',
    price: 40,
    status: 'maintenance',
    imageSource: 'https://images.unsplash.com/photo-1509248961154-2b5ff4bd378b?w=800&q=80',
    imageFile: 'haunted-house.jpg',
  },
  {
    name: 'מופע האור והמוזיקה',
    description: 'מופע ערב מרהיב עם לייזרים, פירוטכניקה ומוזיקה חיה.',
    capacity: 500,
    minimumHeight: 0,
    category: 'show',
    price: 15,
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    imageFile: 'light-show.jpg',
  },
];

const couponSeeds = [
  {
    code: 'LUNA10',
    description: '10% הנחה לכרטיס יום שלם',
    discountPercent: 10,
    expiresAt: new Date('2026-12-31'),
    usageLimit: 100,
    isActive: true,
    imageSource: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&q=80',
    imageFile: 'coupon-luna10.jpg',
  },
  {
    code: 'SUMMER20',
    description: '20% הנחה לקיץ 2026',
    discountPercent: 20,
    expiresAt: new Date('2026-09-30'),
    usageLimit: 50,
    isActive: true,
    imageSource: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80',
    imageFile: 'coupon-summer20.jpg',
  },
  {
    code: 'FAMILY15',
    description: '15% הנחה למשפחות',
    discountPercent: 15,
    expiresAt: new Date('2026-12-31'),
    usageLimit: null,
    isActive: true,
    imageSource: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=80',
    imageFile: 'coupon-family15.jpg',
  },
  {
    code: 'VIP25',
    description: '25% הנחה VIP — מוגבל',
    discountPercent: 25,
    expiresAt: new Date('2026-06-30'),
    usageLimit: 10,
    usedCount: 2,
    isActive: true,
    imageSource: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80',
    imageFile: 'coupon-vip25.jpg',
  },
];

async function seedAdmin() {
  const email = adminEmail?.toLowerCase().trim() || '';
  const password = adminPassword?.trim() || '';

  if (!email || !password) {
    console.log('Admin seed skipped (set ADMIN_EMAIL and ADMIN_PASSWORD in .env)');
    return;
  }

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin user already exists (${email})`);
      return;
    }
    console.warn(
      `Admin seed skipped: ${email} is already registered as a customer. ` +
        'Use a dedicated admin email or remove the existing user manually.'
    );
    return;
  }

  await User.create({
    name: adminName,
    email,
    password,
    role: 'admin',
  });
  console.log(`Seeded admin user: ${email}`);
}

async function seedDatabase() {
  await seedAdmin();

  const rideCount = await Ride.countDocuments();
  if (rideCount === 0) {
    const rides = [];
    for (const seed of rideSeeds) {
      const { imageSource, imageFile, ...rest } = seed;
      try {
        rest.imageUrl = await downloadImage(imageSource, imageFile);
      } catch (err) {
        console.warn(`Could not download image for ${rest.name}:`, err.message);
        rest.imageUrl = '';
      }
      rides.push(rest);
    }
    await Ride.insertMany(rides);
    console.log(`Seeded ${rides.length} rides`);
  } else {
    console.log(`Rides already exist (${rideCount}), skipping ride seed`);
    for (const seed of rideSeeds) {
      await Ride.updateOne(
        { name: seed.name, $or: [{ price: { $exists: false } }, { price: null }] },
        { $set: { price: seed.price } }
      );
    }
  }

  const couponCount = await Coupon.countDocuments();
  if (couponCount === 0) {
    const coupons = [];
    for (const seed of couponSeeds) {
      const { imageSource, imageFile, ...rest } = seed;
      try {
        rest.imageUrl = await downloadImage(imageSource, imageFile);
      } catch (err) {
        console.warn(`Could not download image for ${rest.code}:`, err.message);
        rest.imageUrl = '';
      }
      coupons.push(rest);
    }
    await Coupon.insertMany(coupons);
    console.log(`Seeded ${coupons.length} coupons`);
  } else {
    console.log(`Coupons already exist (${couponCount}), skipping coupon seed`);
  }
}

module.exports = { seedDatabase };
