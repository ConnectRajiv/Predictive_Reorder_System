const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  averageDailyConsumption: {
    type: Number,
    required: true
  },
  consumptionTrend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable'],
    required: true
  },
  trendPercentage: {
    type: Number,
    default: 0
  },
  predictedStockoutDate: {
    type: Date
  },
  suggestedReorderQuantity: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = Prediction;
