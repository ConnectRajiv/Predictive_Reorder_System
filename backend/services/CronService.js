const cron = require('node-cron');
const ForecastService = require('./ForecastService');
const Product = require('../models/Product');
const Prediction = require('../models/Prediction');
const Alert = require('../models/Alert');

class CronService {
  constructor() {
    this.forecastService = new ForecastService();
  }
  
  /**
   * Initialize cron jobs
   */
  init() {
    // Run daily at midnight to update predictions
    cron.schedule('0 0 * * *', () => {
      console.log('Running daily prediction update job');
      this.updateAllPredictions();
    });
    
    // Run every 6 hours to check for low stock
    cron.schedule('0 */6 * * *', () => {
      console.log('Running stock check job');
      this.checkLowStock();
    });
  }
  
  /**
   * Update predictions for all products
   */
  async updateAllPredictions() {
    try {
      const products = await Product.find();
      console.log(`Updating predictions for ${products.length} products`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const product of products) {
        try {
          // Generate forecast
          const forecast = await this.forecastService.getProductForecast(product._id);
          
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
          
          await prediction.save();
          
          // Check for predicted stockout within 7 days
          if (forecast.stockoutDate) {
            const stockoutDate = new Date(forecast.stockoutDate);
            const sevenDaysLater = new Date();
            sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
            
            if (stockoutDate <= sevenDaysLater) {
              const daysUntilStockout = Math.ceil((stockoutDate - new Date()) / (1000 * 60 * 60 * 24));
              
              const alert = new Alert({
                productId: product._id,
                type: 'predicted_stockout',
                message: `${product.name} (${product.sku}) is predicted to stock out in ${daysUntilStockout} days. Suggested reorder quantity: ${forecast.reorderQuantity}`,
                status: 'new'
              });
              await alert.save();
            }
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error updating prediction for product ${product._id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`Prediction update job completed. Success: ${successCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error('Error in updateAllPredictions job:', error);
    }
  }
  
  /**
   * Check for products with stock below reorder point
   */
  async checkLowStock() {
    try {
      // Find all products where currentStock <= reorderPoint
      const lowStockProducts = await Product.find({
        $expr: { $lte: ['$currentStock', '$reorderPoint'] }
      });
      
      console.log(`Found ${lowStockProducts.length} products with low stock`);
      
      for (const product of lowStockProducts) {
        try {
          // Check if an active alert already exists for this product
          const existingAlert = await Alert.findOne({
            productId: product._id,
            type: 'low_stock',
            status: { $in: ['new', 'read'] },
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
          });
          
          if (!existingAlert) {
            // Create new alert
            const alert = new Alert({
              productId: product._id,
              type: 'low_stock',
              message: `${product.name} (${product.sku}) is below the reorder point (${product.currentStock} < ${product.reorderPoint})`,
              status: 'new'
            });
            await alert.save();
          }
        } catch (error) {
          console.error(`Error creating alert for product ${product._id}:`, error);
        }
      }
      
      console.log('Stock check job completed');
    } catch (error) {
      console.error('Error in checkLowStock job:', error);
    }
  }
}

module.exports = new CronService();
