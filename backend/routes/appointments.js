const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// Book appointment
router.post('/', async (req, res) => {
  try {
    const { doctorId, date, timeSlot, userId } = req.body;

    // Check availability
    const existing = await Appointment.findOne({ doctor: doctorId, date, timeSlot, status: 'Booked' });
    if (existing) return res.status(400).json({ message: 'This slot is already booked' });

    const appointment = new Appointment({
      patient: userId,
      doctor: doctorId,
      date,
      timeSlot
    });

    await appointment.save();
    res.status(201).json({ message: 'Appointment successfully booked', appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user appointments
router.get('/user/:userId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.userId }).populate('doctor');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all appointments (Admin)
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient doctor');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
