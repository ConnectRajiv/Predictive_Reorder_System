const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

// GET all predictions
router.get('/', predictionController.getAllPredictions);

// GET predictions for a specific product
router.get('/product/:productId', predictionController.getProductPredictions);

// POST trigger a prediction calculation for a specific product
router.post('/calculate/:productId', predictionController.calculatePrediction);

// POST calculate predictions for all products
router.post('/calculate', predictionController.calculateAllPredictions);

module.exports = router;
