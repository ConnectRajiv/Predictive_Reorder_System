const mongoose = require('mongoose');
const Product = require('../models/Product');

// MongoDB Atlas connection string - fixed format
const MONGODB_URI = 'mongodb+srv://rajivranjan9147:Rajiv%40123@cluster0.iqylndg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
async function testProductModel() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas successfully');
    
    // Create a test product
    const testProduct = new Product({
      name: 'Test Product',
      sku: 'TEST-SKU-001',
      description: 'This is a test product',
      supplier: {
        name: 'Test Supplier',
        contactInfo: '123-456-7890',
        email: 'supplier@test.com'
      },
      currentStock: 20,
      reorderPoint: 10,
      safetyStock: 5,
      leadTime: 7,
      unitOfMeasure: 'unit',
      category: 'Test Category'
    });

    // Save the test product
    console.log('Saving test product...');
    const savedProduct = await testProduct.save();
    console.log('Test product saved successfully:', savedProduct);

    // Retrieve the product
    console.log('Retrieving test product...');
    const retrievedProduct = await Product.findOne({ sku: 'TEST-SKU-001' });
    console.log('Test product retrieved successfully:', retrievedProduct);

    // Update the product
    console.log('Updating test product...');
    const updatedProduct = await Product.findOneAndUpdate(
      { sku: 'TEST-SKU-001' },
      { currentStock: 25, description: 'Updated test product' },
      { new: true }
    );
    console.log('Test product updated successfully:', updatedProduct);

    // Delete the test product
    console.log('Deleting test product...');
    const deleteResult = await Product.deleteOne({ sku: 'TEST-SKU-001' });
    console.log('Test product deleted successfully:', deleteResult);

    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testProductModel();
