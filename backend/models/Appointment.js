const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  timeSlot: { type: String, required: true },
  status: { type: String, enum: ['Booked', 'Completed', 'Cancelled', 'In-Progress'], default: 'Booked' },
  diagnosis: { type: String },
  treatmentRecord: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
