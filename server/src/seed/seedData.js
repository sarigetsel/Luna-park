const Ride = require('../models/Ride');
const Coupon = require('../models/Coupon');
const { downloadImage } = require('./downloadMedia');

const rideSeeds = [
  {
    name: 'גלגל הענק לונה',
    description: 'גלגל ענק מרהיב עם נוף פנורמי על כל הפארק — חוויה מושלמת לכל המשפחה.',
    capacity: 24,
    minimumHeight: 120,
    category: 'family',
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1596436889104-947806097606?w=900&q=85',
    imageFile: 'ferris-wheel-v2.jpg',
  },
  {
    name: 'רכבת ההרים אדרנלין',
    description: 'רכבת הרים מהירה עם לולאות וירידות תלולות — למחפשי הריגושים.',
    capacity: 16,
    minimumHeight: 140,
    category: 'thrill',
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7ee81?w=900&q=85',
    imageFile: 'roller-coaster-v2.jpg',
  },
  {
    name: 'קרוסלת הכוכבים',
    description: 'קרוסלה קלאסית מעוטרת באורות צבעוניים — מתאימה לכל הגילאים.',
    capacity: 40,
    minimumHeight: 90,
    category: 'kids',
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1572027632283-1b9349e7dd3b?w=900&q=85',
    imageFile: 'carousel-v2.jpg',
  },
  {
    name: 'מגלשת המים הכחולה',
    description: 'מגלשת מים ארוכה עם מתזים ובריכה — הדרך המושלמת להתקרר בקיץ.',
    capacity: 2,
    minimumHeight: 110,
    category: 'water',
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1519046901590-f0d710f1cfeb?w=900&q=85',
    imageFile: 'water-slide-v2.jpg',
  },
  {
    name: 'בית האימה לילי',
    description: 'חוויה מפחידה עם אפקטים מיוחדים ותאורה דרמטית — לא לחלשי לב.',
    capacity: 8,
    minimumHeight: 130,
    category: 'thrill',
    status: 'maintenance',
    imageSource: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=900&q=85',
    imageFile: 'haunted-house-v2.jpg',
  },
  {
    name: 'מופע האור והמוזיקה',
    description: 'מופע ערב מרהיב עם לייזרים, פירוטכניקה ומוזיקה חיה.',
    capacity: 500,
    minimumHeight: 0,
    category: 'show',
    status: 'active',
    imageSource: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=85',
    imageFile: 'light-show-v2.jpg',
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
    imageSource: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=500&q=85',
    imageFile: 'coupon-luna10-v2.jpg',
  },
  {
    code: 'SUMMER20',
    description: '20% הנחה לקיץ 2026',
    discountPercent: 20,
    expiresAt: new Date('2026-09-30'),
    usageLimit: 50,
    isActive: true,
    imageSource: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=85',
    imageFile: 'coupon-summer20-v2.jpg',
  },
  {
    code: 'FAMILY15',
    description: '15% הנחה למשפחות',
    discountPercent: 15,
    expiresAt: new Date('2026-12-31'),
    usageLimit: null,
    isActive: true,
    imageSource: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&q=85',
    imageFile: 'coupon-family15-v2.jpg',
  },
  {
    code: 'VIP25',
    description: '25% הנחה VIP — מוגבל',
    discountPercent: 25,
    expiresAt: new Date('2026-06-30'),
    usageLimit: 10,
    usedCount: 2,
    isActive: true,
    imageSource: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=85',
    imageFile: 'coupon-vip25-v2.jpg',
  },
];

async function seedDatabase() {
  const rideCount = await Ride.countDocuments();
  if (rideCount === 0) {
    const rides = [];
    for (const seed of rideSeeds) {
      const { imageSource, imageFile, ...rest } = seed;
      try {
        rest.imageUrl = await downloadImage(imageSource, imageFile);
      } catch (err) {
        console.warn(`Could not download image for ${rest.name}:`, err.message);
        rest.imageUrl = imageSource;
      }
      rides.push(rest);
    }
    await Ride.insertMany(rides);
    console.log(`Seeded ${rides.length} rides`);
  } else {
    console.log(`Rides already exist (${rideCount}), skipping ride seed`);
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
        rest.imageUrl = imageSource;
      }
      coupons.push(rest);
    }
    await Coupon.insertMany(coupons);
    console.log(`Seeded ${coupons.length} coupons`);
  } else {
    console.log(`Coupons already exist (${couponCount}), skipping coupon seed`);
  }
}

module.exports = { seedDatabase, rideSeeds, couponSeeds };
