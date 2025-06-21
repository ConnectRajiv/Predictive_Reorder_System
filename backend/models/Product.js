const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  sku: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  description: {
    type: String,
    trim: true
  },
  supplier: {
    name: { type: String },
    contactInfo: String,
    email: String
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reorderPoint: {
    type: Number,
    required: true,
    default: 10,
    min: 0
  },
  safetyStock: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  leadTime: {
    type: Number,  // In days
    required: true,
    default: 7,
    min: 1
  },
  unitOfMeasure: {
    type: String,
    default: 'unit'
  },
  category: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
