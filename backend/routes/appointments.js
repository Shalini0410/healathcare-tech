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

// Get doctor appointments
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.params.doctorId }).populate('patient');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update appointment medical record (Diagnosis/Treatment)
router.put('/:id/record', async (req, res) => {
  try {
    const { diagnosis, treatmentRecord, notes, status } = req.body;
    
    // Only update fields that are provided
    const updateData = {};
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (treatmentRecord !== undefined) updateData.treatmentRecord = treatmentRecord;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(appointment);
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
