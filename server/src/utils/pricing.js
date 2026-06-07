const { fullDayPrice, hourlyRate } = require('../config/env');

function calculateBasePrice(ticketType, hoursAmount) {
  if (ticketType === 'full_day') {
    return fullDayPrice;
  }
  if (ticketType === 'hourly') {
    if (!hoursAmount || hoursAmount < 1) {
      throw new Error('hoursAmount is required for hourly tickets');
    }
    return hourlyRate * hoursAmount;
  }
  throw new Error('Invalid ticketType');
}

function applyDiscount(basePrice, discountPercent) {
  const discountApplied = Math.round(basePrice * (discountPercent / 100) * 100) / 100;
  const finalPrice = Math.round((basePrice - discountApplied) * 100) / 100;
  return { discountApplied, finalPrice };
}

function calculateTotal(ticketType, hoursAmount, coupon) {
  const totalPrice = calculateBasePrice(ticketType, hoursAmount);
  if (!coupon) {
    return { totalPrice, discountApplied: 0, finalPrice: totalPrice, couponCode: null };
  }
  const { discountApplied, finalPrice } = applyDiscount(totalPrice, coupon.discountPercent);
  return {
    totalPrice,
    discountApplied,
    finalPrice,
    couponCode: coupon.code,
  };
}

module.exports = { calculateBasePrice, applyDiscount, calculateTotal };
