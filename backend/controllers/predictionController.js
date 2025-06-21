const ForecastService = require('../services/ForecastService');
const Product = require('../models/Product');
const Prediction = require('../models/Prediction');

const forecastService = new ForecastService();

// Get all predictions
exports.getAllPredictions = async (req, res) => {
  try {
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .populate('productId', 'name sku currentStock');
      
    res.status(200).json(predictions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching predictions', error: error.message });
  }
};

// Get predictions for a specific product
exports.getProductPredictions = async (req, res) => {
  try {
    const { productId } = req.params;
    const predictions = await Prediction.find({ productId })
      .sort({ createdAt: -1 })
      .populate('productId', 'name sku currentStock');
      
    res.status(200).json(predictions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching predictions', error: error.message });
  }
};

// Calculate prediction for a specific product
exports.calculatePrediction = async (req, res) => {
  try {
    const { productId } = req.params;
    const { days } = req.query || { days: 30 };
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Generate forecast
    const forecast = await forecastService.getProductForecast(productId, parseInt(days, 10));
    
    // Create prediction record
    const prediction = new Prediction({
      productId,
      averageDailyConsumption: forecast.averageDailyConsumption,
      consumptionTrend: forecast.trend.trendType,
      trendPercentage: forecast.trend.percentageChange,
      predictedStockoutDate: forecast.stockoutDate,
      suggestedReorderQuantity: forecast.reorderQuantity,
      createdAt: new Date()
    });
    
    const savedPrediction = await prediction.save();
    
    // Check if stock is below reorder point and create alert if needed
    await checkAndCreateAlert(product, savedPrediction);
    
    res.status(201).json(savedPrediction);
  } catch (error) {
    res.status(500).json({ message: 'Error calculating prediction', error: error.message });
  }
};

// Calculate predictions for all products
exports.calculateAllPredictions = async (req, res) => {
  try {
    const { days } = req.query || { days: 30 };
    const products = await Product.find();
    const results = [];
    
    for (const product of products) {
      try {
        // Generate forecast
        const forecast = await forecastService.getProductForecast(product._id, parseInt(days, 10));
        
        // Create prediction record
        const prediction = new Prediction({
          productId: product._id,
          averageDailyConsumption: forecast.averageDailyConsumption,
          consumptionTrend: forecast.trend.trendType,
          trendPercentage: forecast.trend.percentageChange,
          predictedStockoutDate: forecast.stockoutDate,
          suggestedReorderQuantity: forecast.reorderQuantity,
          createdAt: new Date()
        });
        
        const savedPrediction = await prediction.save();
        
        // Check if stock is below reorder point and create alert
        await checkAndCreateAlert(product, savedPrediction);
        
        results.push(savedPrediction);
      } catch (err) {
        // Log the error but continue with other products
        console.error(`Error calculating prediction for product ${product._id}:`, err);
      }
    }
    
    res.status(201).json({
      message: `Calculated predictions for ${results.length} out of ${products.length} products`,
      predictions: results
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating predictions', error: error.message });
  }
};

// Helper function to check and create alerts
async function checkAndCreateAlert(product, prediction) {
  const Alert = require('../models/Alert');
  
  try {
    // Check if stock is below reorder point
    if (product.currentStock <= product.reorderPoint) {
      const alert = new Alert({
        productId: product._id,
        type: 'low_stock',
        message: `${product.name} (${product.sku}) is below the reorder point (${product.currentStock} < ${product.reorderPoint})`,
        status: 'new'
      });
      await alert.save();
    }
    
    // Check if stockout is predicted within the next 7 days
    if (prediction.predictedStockoutDate) {
      const stockoutDate = new Date(prediction.predictedStockoutDate);
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
      
      if (stockoutDate <= sevenDaysLater) {
        const daysUntilStockout = Math.ceil((stockoutDate - new Date()) / (1000 * 60 * 60 * 24));
        
        const alert = new Alert({
          productId: product._id,
          type: 'predicted_stockout',
          message: `${product.name} (${product.sku}) is predicted to stock out in ${daysUntilStockout} days. Suggested reorder quantity: ${prediction.suggestedReorderQuantity}`,
          status: 'new'
        });
        await alert.save();
      }
    }
  } catch (err) {
    console.error('Error creating alert:', err);
  }
}
