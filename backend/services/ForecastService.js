const InventoryTransaction = require('../models/InventoryTransaction');
const Product = require('../models/Product');

class ForecastService {
  /**
   * Calculate average daily consumption over a specified time period
   * @param {string} productId - The ID of the product
   * @param {number} days - Time window in days (e.g., 7, 30, 90)
   * @returns {Promise<number>} - Average daily consumption
   */
  async calculateAverageDailyConsumption(productId, days = 30) {
    try {
      // Calculate the start date based on the specified time window
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Query inventory transactions of type "out" for the specified product
      const outTransactions = await InventoryTransaction.find({
        productId: productId,
        type: "out",
        timestamp: { $gte: startDate }
      });
      
      // Calculate total consumption
      const totalConsumption = outTransactions.reduce((sum, transaction) => sum + transaction.quantity, 0);
      
      // Calculate average daily consumption
      const averageDailyConsumption = totalConsumption / days;
      
      return parseFloat(averageDailyConsumption.toFixed(2));
    } catch (error) {
      console.error('Error calculating average daily consumption:', error);
      throw error;
    }
  }
  
  /**
   * Analyze consumption trends over time
   * @param {string} productId - The ID of the product
   * @param {number} days - Time window in days
   * @returns {Promise<Object>} - Trend analysis result
   */
  async analyzeTrend(productId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Fetch transactions for the specified period
      const transactions = await InventoryTransaction.find({
        productId: productId,
        type: "out",
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });
      
      // Group transactions by day
      const dailyConsumption = {};
      transactions.forEach(transaction => {
        const dateKey = transaction.timestamp.toISOString().split('T')[0];
        dailyConsumption[dateKey] = (dailyConsumption[dateKey] || 0) + transaction.quantity;
      });
      
      // Convert to array of points for linear regression
      const points = Object.entries(dailyConsumption).map(([date, quantity], index) => ({
        x: index, // Use index as x for simplicity
        y: quantity
      }));
      
      // Simple linear regression to determine trend
      const slope = this._calculateLinearRegressionSlope(points);
      
      // Determine trend type
      let trendType;
      if (Math.abs(slope) < 0.05) {
        trendType = 'stable';
      } else if (slope > 0) {
        trendType = 'increasing';
      } else {
        trendType = 'decreasing';
      }
      
      // Calculate percentage change if there are enough data points
      let percentageChange = 0;
      if (points.length > 1) {
        const firstWeekAvg = points.slice(0, Math.min(7, Math.floor(points.length / 2)))
          .reduce((sum, point) => sum + point.y, 0) / Math.min(7, Math.floor(points.length / 2));
        const lastWeekAvg = points.slice(-Math.min(7, Math.floor(points.length / 2)))
          .reduce((sum, point) => sum + point.y, 0) / Math.min(7, Math.floor(points.length / 2));
        
        if (firstWeekAvg !== 0) {
          percentageChange = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;
        }
      }
      
      return {
        trendType,
        slope,
        percentageChange: parseFloat(percentageChange.toFixed(2))
      };
    } catch (error) {
      console.error('Error analyzing trend:', error);
      throw error;
    }
  }
  
  /**
   * Predict stockout date based on current stock and consumption rate
   * @param {string} productId - The ID of the product
   * @param {number} days - Time window in days for consumption calculation
   * @returns {Promise<Date>} - Predicted stockout date
   */
  async predictStockoutDate(productId, days = 30) {
    try {
      // Get current product data
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Get average daily consumption
      const averageDailyConsumption = await this.calculateAverageDailyConsumption(productId, days);
      
      // If no consumption or zero consumption, return null (no stockout expected)
      if (!averageDailyConsumption || averageDailyConsumption === 0) {
        return null;
      }
      
      // Calculate days until stockout
      const daysUntilStockout = product.currentStock / averageDailyConsumption;
      
      // Calculate stockout date
      const stockoutDate = new Date();
      stockoutDate.setDate(stockoutDate.getDate() + Math.floor(daysUntilStockout));
      
      return stockoutDate;
    } catch (error) {
      console.error('Error predicting stockout date:', error);
      throw error;
    }
  }
  
  /**
   * Suggest reorder quantity based on consumption and lead time
   * @param {string} productId - The ID of the product
   * @param {number} days - Time window in days for consumption calculation
   * @returns {Promise<number>} - Suggested reorder quantity
   */
  async suggestReorderQuantity(productId, days = 30) {
    try {
      // Get product data
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Get average daily consumption
      const averageDailyConsumption = await this.calculateAverageDailyConsumption(productId, days);
      
      // Calculate reorder quantity: (averageDailyConsumption × leadTimeDays) + safetyStock
      const reorderQuantity = (averageDailyConsumption * product.leadTime) + product.safetyStock;
      
      return Math.ceil(reorderQuantity); // Round up to ensure we don't understock
    } catch (error) {
      console.error('Error suggesting reorder quantity:', error);
      throw error;
    }
  }
  
  /**
   * Get comprehensive forecast data for a product
   * @param {string} productId - The ID of the product
   * @param {number} days - Time window in days for calculations
   * @returns {Promise<Object>} - Complete forecast information
   */
  async getProductForecast(productId, days = 30) {
    try {
      const [
        averageDailyConsumption,
        trend,
        stockoutDate,
        reorderQuantity
      ] = await Promise.all([
        this.calculateAverageDailyConsumption(productId, days),
        this.analyzeTrend(productId, days),
        this.predictStockoutDate(productId, days),
        this.suggestReorderQuantity(productId, days)
      ]);
      
      return {
        averageDailyConsumption,
        trend,
        stockoutDate,
        reorderQuantity
      };
    } catch (error) {
      console.error('Error generating product forecast:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to calculate linear regression slope
   * @param {Array<Object>} points - Array of {x, y} points
   * @returns {number} - Slope of the line
   */
  _calculateLinearRegressionSlope(points) {
    if (points.length < 2) return 0;
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    const n = points.length;
    
    for (const point of points) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    }
    
    // Formula for slope of linear regression line
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
}

module.exports = ForecastService;
