const User = require('../models/User');
const { signToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = new User({
      name,
      email,
      password,
      role: 'customer',
    });
    await user.save();

    const token = signToken({ id: user._id, email: user.email, role: user.role });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findByCredentials(email, password);
    const token = signToken({ id: user._id, email: user.email, role: user.role });
    res.json({ token, user });
  } catch (err) {
    if (err.statusCode === 401) {
      return res.status(401).json({ message: err.message });
    }
    next(err);
  }
}

module.exports = { register, login };
