import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Ride, { type IRide } from '../models/Ride';
import Coupon from '../models/Coupon';
import User from '../models/User';
import { adminName, adminEmail, adminPassword, uploadDir } from '../config/env';
import { downloadImage } from './downloadMedia';

interface RideSeed {
  name: string;
  description: string;
  capacity: number;
  minimumHeight: number;
  category: IRide['category'];
  price: number;
  status: IRide['status'];
  imageSource: string;
  imageFile: string;
}

type RideInsertData = Omit<RideSeed, 'imageSource' | 'imageFile'> & { imageUrl: string };

interface CouponSeed {
  code: string;
  description: string;
  discountPercent: number;
  expiresAt: Date;
  usageLimit: number | null;
  usedCount?: number;
  isActive: boolean;
  imageSource: string;
  imageFile: string;
}

type CouponInsertData = Omit<CouponSeed, 'imageSource' | 'imageFile'> & { imageUrl: string };

/** Bump when ride image sources change — triggers re-download on next server start. */
const IMAGE_SEED_VERSION = 6;

/** Ride photos sourced from Unsplash. */
const rideSeeds: RideSeed[] = [
  {
    name: 'גלגל הענק לונה',
    description: 'גלגל ענק מואר עם נוף פנורמי על כל הפארק — חוויה מושלמת לכל המשפחה.',
    capacity: 24,
    minimumHeight: 120,
    category: 'family',
    price: 30,
    status: 'active',
    imageSource:
      'https://images.unsplash.com/photo-1520463246322-5f6c5a6fbc62?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1532960405005-a1e4df4f6f7b?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1527092719929-bf2a7b8a50a1?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1470104240373-bc1812eddc9f?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1518012312832-96aea3c91144?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1547744152-14d985cb937f?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1600&q=80',
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
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80',
    imageFile: 'glass-bridge.jpg',
  },
];

function copyFallbackImage(imagesDir: string, destFile: string, fallbackFile: string): boolean {
  const fallbackPath = path.join(imagesDir, fallbackFile);
  const destPath = path.join(imagesDir, destFile);
  if (!fs.existsSync(fallbackPath)) {
    return false;
  }
  fs.copyFileSync(fallbackPath, destPath);
  return true;
}

function ensureLocalPlaceholderImage(imagesDir: string): string {
  const placeholderPath = path.join(imagesDir, 'ride-placeholder.jpg');
  if (fs.existsSync(placeholderPath) && fs.statSync(placeholderPath).size > 0) {
    return 'ride-placeholder.jpg';
  }

  const candidateFallbacks = [
    'coupon-luna10.jpg',
    'coupon-summer20.jpg',
    'coupon-family15.jpg',
    'coupon-vip25.jpg',
  ];
  for (const file of candidateFallbacks) {
    const source = path.join(imagesDir, file);
    if (fs.existsSync(source) && fs.statSync(source).size > 0) {
      fs.copyFileSync(source, placeholderPath);
      return 'ride-placeholder.jpg';
    }
  }

  const tinyPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9fJ5gAAAAASUVORK5CYII=';
  fs.writeFileSync(placeholderPath, Buffer.from(tinyPngBase64, 'base64'));
  return 'ride-placeholder.jpg';
}

async function resolveRideImage(seed: RideSeed, imagesDir: string): Promise<string> {
  const dest = path.join(imagesDir, seed.imageFile);
  if (!fs.existsSync(dest)) {
    try {
      return await downloadImage(seed.imageSource, seed.imageFile);
    } catch (err) {
      let copied = copyFallbackImage(imagesDir, seed.imageFile, 'ferris-wheel.jpg');
      if (!copied) {
        const placeholderFile = ensureLocalPlaceholderImage(imagesDir);
        copied = copyFallbackImage(imagesDir, seed.imageFile, placeholderFile);
      }
      if (copied) {
        console.warn(`Used fallback image for ${seed.name}`);
        return `/uploads/images/${seed.imageFile}`;
      }
      throw err as Error;
    }
  }
  return `/uploads/images/${seed.imageFile}`;
}

function getStoredImageVersion(imagesDir: string): number {
  const versionFile = path.join(imagesDir, '.ride-images-version');
  if (!fs.existsSync(versionFile)) {
    return 0;
  }
  const parsed = parseInt(fs.readFileSync(versionFile, 'utf8'), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function markImageVersion(imagesDir: string): void {
  const versionFile = path.join(imagesDir, '.ride-images-version');
  fs.writeFileSync(versionFile, String(IMAGE_SEED_VERSION));
}

async function enforceLocalRideImageUrls(imagesDir: string): Promise<void> {
  for (const seed of rideSeeds) {
    const imagePath = path.join(imagesDir, seed.imageFile);
    if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size === 0) {
      continue;
    }
    const localUrl = `/uploads/images/${seed.imageFile}?v=${IMAGE_SEED_VERSION}`;
    await Ride.updateOne({ name: seed.name }, { $set: { imageUrl: localUrl } });
  }
}

async function backfillRideImages(): Promise<void> {
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
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Could not backfill image for ${seed.name}:`, message);
    }
  }

  if (forceRefresh && refreshFailures === 0) {
    markImageVersion(imagesDir);
  }

  await enforceLocalRideImageUrls(imagesDir);
}

async function dedupeRides(): Promise<void> {
  const rides = await Ride.find().sort({ createdAt: 1 });
  const seen = new Set();
  const duplicateIds: mongoose.Types.ObjectId[] = [];

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

async function syncMissingRides(): Promise<void> {
  let added = 0;

  for (const seed of rideSeeds) {
    const exists = await Ride.findOne({ name: seed.name });
    if (exists) {
      continue;
    }

    const { imageSource: _imageSource, imageFile: _imageFile, ...rest } = seed;
    const imagesDir = path.join(uploadDir, 'images');
    const rideData: RideInsertData = { ...rest, imageUrl: '' };

    try {
      rideData.imageUrl = await resolveRideImage(seed, imagesDir);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Could not download image for ${rideData.name}:`, message);
    }

    await Ride.create(rideData);
    added += 1;
  }

  if (added > 0) {
    console.log(`Added ${added} new rides`);
  }
}

const couponSeeds: CouponSeed[] = [
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

async function seedAdmin(): Promise<void> {
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

export async function seedDatabase(): Promise<void> {
  await seedAdmin();

  const rideCount = await Ride.countDocuments();
  if (rideCount === 0) {
    const rides: RideInsertData[] = [];
    const imagesDir = path.join(uploadDir, 'images');

    for (const seed of rideSeeds) {
      const { imageSource: _imageSource, imageFile: _imageFile, ...rest } = seed;
      const rideData: RideInsertData = { ...rest, imageUrl: '' };
      try {
        rideData.imageUrl = await resolveRideImage(seed, imagesDir);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Could not download image for ${rideData.name}:`, message);
      }
      rides.push(rideData);
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
    const coupons: CouponInsertData[] = [];
    for (const seed of couponSeeds) {
      const { imageSource, imageFile, ...rest } = seed;
      const couponData: CouponInsertData = { ...rest, imageUrl: '' };
      try {
        couponData.imageUrl = await downloadImage(imageSource, imageFile);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Could not download image for ${couponData.code}:`, message);
      }
      coupons.push(couponData);
    }
    await Coupon.insertMany(coupons);
    console.log(`Seeded ${coupons.length} coupons`);
  } else {
    console.log(`Coupons already exist (${couponCount}), skipping coupon seed`);
  }
}

