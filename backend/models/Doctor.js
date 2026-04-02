const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  availableDays: [{ type: String }], // e.g., ['Mon', 'Wed']
  timeSlots: [{ type: String }] // e.g., ['10:00 AM', '11:00 AM']
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
