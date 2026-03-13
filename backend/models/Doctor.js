const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  availableDays: [{ type: String }], // e.g., ['Monday', 'Wednesday']
  timeSlots: [{ type: String }] // e.g., ['10:00 AM', '10:30 AM']
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
