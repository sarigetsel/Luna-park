const mongoose = require('mongoose');

function getCouponModel() {
  return mongoose.models.Coupon || null;
}

async function validateCoupon(code) {
  if (!code || !String(code).trim()) {
    return null;
  }

  const Coupon = getCouponModel();
  if (!Coupon) {
    const error = new Error('Coupon system is not available yet');
    error.statusCode = 503;
    throw error;
  }

  const normalized = String(code).trim().toUpperCase();
  const coupon = await Coupon.findOne({ code: normalized });

  if (!coupon) {
    const error = new Error('Coupon code is invalid');
    error.statusCode = 400;
    throw error;
  }
  if (!coupon.isActive) {
    const error = new Error('Coupon is not active');
    error.statusCode = 400;
    throw error;
  }
  if (coupon.expiresAt <= new Date()) {
    const error = new Error('Coupon has expired');
    error.statusCode = 400;
    throw error;
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    const error = new Error('Coupon usage limit reached');
    error.statusCode = 400;
    throw error;
  }

  return coupon;
}

async function incrementUsedCount(couponId) {
  const Coupon = getCouponModel();
  if (!Coupon) {
    return;
  }

  await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    },
    { $inc: { usedCount: 1 } }
  );
}

module.exports = { validateCoupon, incrementUsedCount };
