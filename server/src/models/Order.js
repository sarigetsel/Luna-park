const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', default: null },
    ticketType: { type: String, enum: ['full_day', 'hourly', 'ride'], required: true },
    purchaseDate: { type: Date, default: Date.now },
    chosenDate: { type: Date, required: true },
    hoursAmount: { type: Number, default: null },
    startHour: { type: Number, default: null, min: 0, max: 23 },
    endHour: { type: Number, default: null, min: 1, max: 24 },
    couponCode: { type: String, default: null },
    totalPrice: { type: Number, required: true },
    discountApplied: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true },
    ticketCode: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
