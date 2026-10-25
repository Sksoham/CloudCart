const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, trim: true, maxlength: 600, default: '' },
  address: { type: String, required: true, trim: true, maxlength: 200 },
  area: { type: String, required: true, trim: true, maxlength: 80 },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  hours: { type: String, required: true, trim: true, maxlength: 100 },
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
