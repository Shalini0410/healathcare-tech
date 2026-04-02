const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = new User({ name, email, password, role });
    await user.save();

    if (role === 'doctor') {
      const doctorProfile = new Doctor({ 
        userId: user._id, 
        name: user.name, 
        specialization: 'General', 
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] 
      });
      await doctorProfile.save();
    }

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    let doctorId = null;
    if (user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: user._id });
      if (doc) doctorId = doc._id;
    }

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role,
        doctorId 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
