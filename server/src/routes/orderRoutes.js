const { Router } = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const shabbat = require('../middleware/shabbat');
const { createOrder, getMyOrders, getAllOrders } = require('../controllers/orderController');

const router = Router();

router.post('/', auth, shabbat, createOrder);
router.get('/my-orders', auth, getMyOrders);
router.get('/', auth, admin, getAllOrders);

module.exports = router;
