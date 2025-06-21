const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  type: {
    type: String,
    enum: ['in', 'out'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: ['purchase', 'sale', 'return', 'adjustment', 'loss', 'other'],
    default: 'other'
  },
  notes: String,
  documentReference: {
    type: String,  // For PO number, invoice number, etc.
    trim: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
