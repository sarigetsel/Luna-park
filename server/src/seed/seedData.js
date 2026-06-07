const fs = require('fs');
const path = require('path');
const Ride = require('../models/Ride');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const { adminName, adminEmail, adminPassword, uploadDir } = require('../config/env');
const { downloadImage } = require('./downloadMedia');

/** Bump when ride image sources change — triggers re-download on next server start. */
const IMAGE_SEED_VERSION = 3;

/** Real Luna Park Tel Aviv photos from Wikimedia Commons (CC-licensed). */
const rideSeeds = [
  {
    name: 'גלגל הענק לונה',
    description: 'גלגל ענק מואר עם נוף פנורמי על כל הפארק — חוויה מושלמת לכל המשפחה.',
    capacity: 24,
    minimumHeight: 120,
    category: 'family',
    price: 30,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/%D7%94%D7%92%D7%9C%D7%92%D7%9C_%D7%94%D7%A2%D7%A0%D7%A7_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg/960px-%D7%94%D7%92%D7%9C%D7%92%D7%9C_%D7%94%D7%A2%D7%A0%D7%A7_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg',
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
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Anakondacoaster.JPG/960px-Anakondacoaster.JPG',
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
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%90.JPG/960px-%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%90.JPG',
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
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/%D7%94%D7%9E%D7%AA%D7%A7%D7%A0%D7%99%D7%9D_%D7%94%D7%97%D7%93%D7%A9%D7%99%D7%9D_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7.jpg/960px-%D7%94%D7%9E%D7%AA%D7%A7%D7%A0%D7%99%D7%9D_%D7%94%D7%97%D7%93%D7%A9%D7%99%D7%9D_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7.jpg',
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
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/%D7%A8%D7%9B%D7%91%D7%AA_%D7%94%D7%A9%D7%93%D7%99%D7%9D_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg/960px-%D7%A8%D7%9B%D7%91%D7%AA_%D7%94%D7%A9%D7%93%D7%99%D7%9D_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg',
    imageFile: 'haunted-house.jpg',
  },
  {
    name: 'מופע האור והמוזיקה',
    description: 'מופע ערב מרהיב עם זיקוקים, לייזרים ומוזיקה חיה.',
    capacity: 500,
    minimumHeight: 0,
    category: 'show',
    price: 15,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Luna_Park_Tel_Aviv_at_night.jpg/960px-Luna_Park_Tel_Aviv_at_night.jpg',
    imageFile: 'light-show.jpg',
  },
  {
    name: 'מכוניות מתנגשות',
    description: 'מסלול מכוניות צבעוניות עם התנגשויות מבוקרות — כיף לכל המשפחה.',
    capacity: 12,
    minimumHeight: 100,
    category: 'family',
    price: 28,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%904.JPG/960px-%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%904.JPG',
    imageFile: 'bumper-cars.jpg',
  },
  {
    name: 'ספינת השודדים',
    description: 'ספינה מתנדנדת בקצב אדיר — הריגוש מתחיל ברגע שהמתקן נע.',
    capacity: 20,
    minimumHeight: 110,
    category: 'thrill',
    price: 32,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%905.JPG/960px-%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%905.JPG',
    imageFile: 'pirate-ship.jpg',
  },
  {
    name: 'כוסות התה המטורפות',
    description: 'סיבוב מהיר בכוסות צבעוניות — צחוקים מובטחים לקטנים ולגדולים.',
    capacity: 24,
    minimumHeight: 95,
    category: 'kids',
    price: 22,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/%D7%9E%D7%AA%D7%A7%D7%9F_%D7%98%D7%90_%D7%92%D7%90_%D7%93%D7%90_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg/960px-%D7%9E%D7%AA%D7%A7%D7%9F_%D7%98%D7%90_%D7%92%D7%90_%D7%93%D7%90_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg',
    imageFile: 'teacups.jpg',
  },
  {
    name: 'מגדל הנפילה החופשית',
    description: 'עלייה איטית ואז נפילה חופשית מ-50 מטר — לבועות בלבד.',
    capacity: 12,
    minimumHeight: 130,
    category: 'thrill',
    price: 42,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/%D7%9E%D7%AA%D7%A7%D7%9F_%D7%91%D7%9C%D7%90%D7%A7_%D7%9E%D7%9E%D7%91%D7%94_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg/960px-%D7%9E%D7%AA%D7%A7%D7%9F_%D7%91%D7%9C%D7%90%D7%A7_%D7%9E%D7%9E%D7%91%D7%94_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg',
    imageFile: 'drop-tower.jpg',
  },
  {
    name: 'נהר הרפים',
    description: 'שיט בנהר איטי דרך מערות מסתוריות ואפקטים מיוחדים.',
    capacity: 8,
    minimumHeight: 100,
    category: 'family',
    price: 30,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/%D7%A8%D7%9B%D7%91%D7%AA_%D7%94%D7%94%D7%A8%D7%99%D7%9D_%D7%94%D7%9E%D7%A9%D7%A4%D7%97%D7%AA%D7%99%D7%AA_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg/960px-%D7%A8%D7%9B%D7%91%D7%AA_%D7%94%D7%94%D7%A8%D7%99%D7%9D_%D7%94%D7%9E%D7%A9%D7%A4%D7%97%D7%AA%D7%99%D7%AA_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg',
    imageFile: 'lazy-river.jpg',
  },
  {
    name: 'בריכת הגלים',
    description: 'גלים ענקיים בבריכה מחוממת — גלישה וקפיצות בלי הפסקה.',
    capacity: 30,
    minimumHeight: 120,
    category: 'water',
    price: 38,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%907.JPG/960px-%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%907.JPG',
    imageFile: 'wave-pool.jpg',
  },
  {
    name: 'רכבות קרטינג מהירות',
    description: 'מסלול קרטינג מקצועי עם פניות חדות — מי הכי מהיר?',
    capacity: 10,
    minimumHeight: 130,
    category: 'thrill',
    price: 36,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/%D7%9E%D7%AA%D7%A7%D7%9F_%D7%91%D7%A8%D7%99%D7%99%D7%A7%D7%93%D7%90%D7%A0%D7%A1%D7%A8_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg/960px-%D7%9E%D7%AA%D7%A7%D7%9F_%D7%91%D7%A8%D7%99%D7%99%D7%A7%D7%93%D7%90%D7%A0%D7%A1%D7%A8_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg',
    imageFile: 'go-kart.jpg',
  },
  {
    name: 'בית הבלונים הקסום',
    description: 'חדר מלא בבלונים צבעוניים ומראות — גן עדן לילדים.',
    capacity: 15,
    minimumHeight: 0,
    category: 'kids',
    price: 18,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/%D7%90%D7%99%D7%96%D7%95%D7%A8_%D7%A2%D7%95%D7%9C%D7%9D_%D7%90%D7%91%D7%A0%D7%99_%D7%94%D7%97%D7%9F_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg/960px-%D7%90%D7%99%D7%96%D7%95%D7%A8_%D7%A2%D7%95%D7%9C%D7%9D_%D7%90%D7%91%D7%A0%D7%99_%D7%94%D7%97%D7%9F_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg',
    imageFile: 'ball-pit.jpg',
  },
  {
    name: 'מסע בגלקסיה',
    description: 'סימולטור חלל תלת-ממדי עם אפקטים מרהיבים וסאונד היקפי.',
    capacity: 18,
    minimumHeight: 105,
    category: 'family',
    price: 34,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/%D7%9E%D7%AA%D7%A7%D7%9F_%D7%A1%D7%99%D7%A0%D7%9E%D7%94_%D7%9C%D7%95%D7%A0%D7%94_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg/960px-%D7%9E%D7%AA%D7%A7%D7%9F_%D7%A1%D7%99%D7%A0%D7%9E%D7%94_%D7%9C%D7%95%D7%A0%D7%94_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg',
    imageFile: 'space-ride.jpg',
  },
  {
    name: 'הגשר השקוף',
    description: 'הליכה על גשר זכוכית בגובה 40 מטר — נוף מרהיב ורגליים רועדות.',
    capacity: 6,
    minimumHeight: 120,
    category: 'thrill',
    price: 25,
    status: 'active',
    imageSource:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/%D7%9E%D7%AA%D7%A7%D7%9F_%D7%A1%D7%98%D7%90%D7%A8_%D7%A4%D7%9C%D7%99%D7%99%D7%A8_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg/960px-%D7%9E%D7%AA%D7%A7%D7%9F_%D7%A1%D7%98%D7%90%D7%A8_%D7%A4%D7%9C%D7%99%D7%99%D7%A8_%D7%91%D7%9C%D7%95%D7%A0%D7%94_%D7%A4%D7%90%D7%A8%D7%A7_%D7%AA%D7%9C_%D7%90%D7%91%D7%99%D7%91.jpg',
    imageFile: 'glass-bridge.jpg',
  },
];

function copyFallbackImage(imagesDir, destFile, fallbackFile) {
  const fallbackPath = path.join(imagesDir, fallbackFile);
  const destPath = path.join(imagesDir, destFile);
  if (!fs.existsSync(fallbackPath)) {
    return false;
  }
  fs.copyFileSync(fallbackPath, destPath);
  return true;
}

async function resolveRideImage(seed, imagesDir) {
  const dest = path.join(imagesDir, seed.imageFile);
  if (!fs.existsSync(dest)) {
    try {
      return await downloadImage(seed.imageSource, seed.imageFile);
    } catch (err) {
      const copied = copyFallbackImage(imagesDir, seed.imageFile, 'ferris-wheel.jpg');
      if (copied) {
        console.warn(`Used fallback image for ${seed.name}`);
        return `/uploads/images/${seed.imageFile}`;
      }
      throw err;
    }
  }
  return `/uploads/images/${seed.imageFile}`;
}

function getStoredImageVersion(imagesDir) {
  const versionFile = path.join(imagesDir, '.ride-images-version');
  if (!fs.existsSync(versionFile)) {
    return 0;
  }
  const parsed = parseInt(fs.readFileSync(versionFile, 'utf8'), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function markImageVersion(imagesDir) {
  const versionFile = path.join(imagesDir, '.ride-images-version');
  fs.writeFileSync(versionFile, String(IMAGE_SEED_VERSION));
}

async function backfillRideImages() {
  const imagesDir = path.join(uploadDir, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const forceRefresh = getStoredImageVersion(imagesDir) < IMAGE_SEED_VERSION;
  let refreshFailures = 0;
  if (forceRefresh) {
    console.log(`Refreshing ride images to version ${IMAGE_SEED_VERSION} (Luna Park Tel Aviv)`);
  }

  for (const seed of rideSeeds) {
    const ride = await Ride.findOne({ name: seed.name });
    const dest = path.join(imagesDir, seed.imageFile);
    const fileMissing = !fs.existsSync(dest);

    if (!forceRefresh && !fileMissing && ride?.imageUrl) {
      continue;
    }

    if (forceRefresh && fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }

    try {
      const imageUrl = await resolveRideImage(seed, imagesDir);
      if (ride && ride.imageUrl !== imageUrl) {
        ride.imageUrl = imageUrl;
        await ride.save();
      }
      if (fileMissing || forceRefresh) {
        console.log(`Backfilled ride image: ${seed.imageFile}`);
      }
    } catch (err) {
      refreshFailures += 1;
      console.warn(`Could not backfill image for ${seed.name}:`, err.message);
    }
  }

  if (forceRefresh && refreshFailures === 0) {
    markImageVersion(imagesDir);
  }
}

async function dedupeRides() {
  const rides = await Ride.find().sort({ createdAt: 1 });
  const seen = new Set();
  const duplicateIds = [];

  for (const ride of rides) {
    if (seen.has(ride.name)) {
      duplicateIds.push(ride._id);
    } else {
      seen.add(ride.name);
    }
  }

  if (duplicateIds.length > 0) {
    await Ride.deleteMany({ _id: { $in: duplicateIds } });
    console.log(`Removed ${duplicateIds.length} duplicate rides`);
  }
}

async function syncMissingRides() {
  let added = 0;

  for (const seed of rideSeeds) {
    const exists = await Ride.findOne({ name: seed.name });
    if (exists) {
      continue;
    }

    const { imageSource, imageFile, ...rest } = seed;
    const imagesDir = path.join(uploadDir, 'images');

    try {
      rest.imageUrl = await resolveRideImage(seed, imagesDir);
    } catch (err) {
      console.warn(`Could not download image for ${rest.name}:`, err.message);
      rest.imageUrl = '';
    }

    await Ride.create(rest);
    added += 1;
  }

  if (added > 0) {
    console.log(`Added ${added} new rides`);
  }
}

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
      existing.name = adminName;
      existing.password = password;
      await existing.save();
      console.log(`Admin user synced from .env (${email})`);
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
    const imagesDir = path.join(uploadDir, 'images');

    for (const seed of rideSeeds) {
      const { imageSource, imageFile, ...rest } = seed;
      try {
        rest.imageUrl = await resolveRideImage(seed, imagesDir);
      } catch (err) {
        console.warn(`Could not download image for ${rest.name}:`, err.message);
        rest.imageUrl = '';
      }
      rides.push(rest);
    }
    await Ride.insertMany(rides);
    console.log(`Seeded ${rides.length} rides`);
  } else {
    await dedupeRides();
    const countAfterDedupe = await Ride.countDocuments();
    console.log(`Rides in database: ${countAfterDedupe}, syncing new rides`);
    await syncMissingRides();
    for (const seed of rideSeeds) {
      await Ride.updateOne(
        { name: seed.name, $or: [{ price: { $exists: false } }, { price: null }] },
        { $set: { price: seed.price } }
      );
    }
  }

  await backfillRideImages();

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
