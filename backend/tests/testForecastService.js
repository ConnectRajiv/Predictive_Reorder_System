const mongoose = require('mongoose');
const ForecastService = require('../services/ForecastService');
const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://rajivranjan9147:Rajiv%40123@cluster0.iqylndg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testForecastService() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully');
    
    // Create test service
    const forecastService = new ForecastService();
    
    // Create a test product
    const testProduct = new Product({
      name: 'Forecast Test Product',
      sku: 'FORECAST-TEST-001',
      description: 'Product for testing forecasting algorithms',
      supplier: {
        name: 'Test Supplier',
        contactInfo: '123-456-7890',
        email: 'supplier@test.com'
      },
      currentStock: 100,
      reorderPoint: 25,
      safetyStock: 15,
      leadTime: 5, // 5 days lead time
      unitOfMeasure: 'unit',
      category: 'Test Category'
    });
    
    // Save the test product
    console.log('Saving test product...');
    const savedProduct = await testProduct.save();
    console.log('Test product saved with ID:', savedProduct._id);
    
    // Create test inventory transactions (last 30 days)
    const transactions = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Create varying consumption pattern (increasing trend)
      let quantity = 3; // base consumption
      if (i < 10) quantity = 5; // more recent consumption is higher
      if (i > 20) quantity = 2; // older consumption is lower
      
      transactions.push({
        productId: savedProduct._id,
        type: 'out',
        quantity: quantity,
        timestamp: date,
        reason: 'Testing'
      });
    }
    
    // Save transactions
    console.log('Creating test inventory transactions...');
    await InventoryTransaction.insertMany(transactions);
    console.log('Created test inventory transactions');
    
    // Test each forecasting function
    console.log('\n--- FORECAST TESTING RESULTS ---\n');
    
    // 1. Test average daily consumption
    const avgConsumption = await forecastService.calculateAverageDailyConsumption(savedProduct._id, 30);
    console.log('Average Daily Consumption:', avgConsumption);
    
    // 2. Test trend analysis
    const trend = await forecastService.analyzeTrend(savedProduct._id, 30);
    console.log('Consumption Trend:', trend);
    
    // 3. Test stockout prediction
    const stockoutDate = await forecastService.predictStockoutDate(savedProduct._id);
    console.log('Predicted Stockout Date:', stockoutDate);
    
    // 4. Test reorder quantity suggestion
    const reorderQty = await forecastService.suggestReorderQuantity(savedProduct._id);
    console.log('Suggested Reorder Quantity:', reorderQty);
    
    // 5. Test comprehensive forecast
    const forecast = await forecastService.getProductForecast(savedProduct._id);
    console.log('\nComprehensive Forecast:', JSON.stringify(forecast, null, 2));
    
    // Clean up test data
    console.log('\nCleaning up test data...');
    await InventoryTransaction.deleteMany({ productId: savedProduct._id });
    await Product.deleteOne({ _id: savedProduct._id });
    console.log('Test data cleaned up successfully');
    
  } catch (error) {
    console.error('Error during forecast testing:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testForecastService();
