const mongoose = require('mongoose');
const Order = require('../models/Order');
const { calculateTotal } = require('../utils/pricing');
const { validateCoupon, incrementUsedCount } = require('../utils/couponValidator');

function getRideModel() {
  return mongoose.models.Ride || null;
}

async function createOrder(req, res, next) {
  try {
    const { ticketType, chosenDate, hoursAmount, rideId, couponCode } = req.body;

    if (!ticketType || !chosenDate) {
      return res.status(400).json({ message: 'ticketType and chosenDate are required' });
    }

    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can create orders' });
    }

    const visitDate = new Date(chosenDate);
    if (Number.isNaN(visitDate.getTime())) {
      return res.status(400).json({ message: 'chosenDate is invalid' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (visitDate < today) {
      return res.status(400).json({ message: 'chosenDate cannot be in the past' });
    }

    if (ticketType === 'hourly' && (!hoursAmount || hoursAmount < 1)) {
      return res.status(400).json({ message: 'hoursAmount is required for hourly tickets' });
    }

    if (rideId) {
      if (!mongoose.Types.ObjectId.isValid(rideId)) {
        return res.status(400).json({ message: 'rideId is invalid' });
      }
      const Ride = getRideModel();
      if (Ride) {
        const ride = await Ride.findById(rideId);
        if (!ride) {
          return res.status(404).json({ message: 'Ride not found' });
        }
      }
    }

    let coupon = null;
    if (couponCode) {
      coupon = await validateCoupon(couponCode);
    }

    let pricing;
    try {
      pricing = calculateTotal(ticketType, hoursAmount, coupon);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const order = await Order.create({
      userId: req.user.id,
      rideId: rideId || null,
      ticketType,
      chosenDate: visitDate,
      hoursAmount: ticketType === 'hourly' ? hoursAmount : null,
      couponCode: pricing.couponCode,
      totalPrice: pricing.totalPrice,
      discountApplied: pricing.discountApplied,
      finalPrice: pricing.finalPrice,
    });

    if (coupon) {
      await incrementUsedCount(coupon._id);
    }

    await order.populate('rideId', 'name');
    res.status(201).json({ order });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('rideId', 'name')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

async function getAllOrders(req, res, next) {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('rideId', 'name')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getMyOrders, getAllOrders };
