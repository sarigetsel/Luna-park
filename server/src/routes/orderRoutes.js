const { Router } = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const shabbat = require('../middleware/shabbat');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  validateTicket,
  getOrderBarcode,
} = require('../controllers/orderController');

const router = Router();

router.post('/', auth, shabbat, createOrder);
router.get('/my-orders', auth, getMyOrders);
router.get('/my-orders/:id/barcode', auth, getOrderBarcode);
router.get('/validate/:code', auth, admin, validateTicket);
router.get('/', auth, admin, getAllOrders);

module.exports = router;
