const InventoryTransaction = require('../models/InventoryTransaction');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get transactions with optional filtering
exports.getTransactions = async (req, res) => {
  try {
    const filter = {};
    
    // Apply filters if provided
    if (req.query.productId) {
      filter.productId = req.query.productId;
    }
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.timestamp = {};
      
      if (req.query.startDate) {
        filter.timestamp.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        filter.timestamp.$lte = new Date(req.query.endDate);
      }
    }
    
    const transactions = await InventoryTransaction.find(filter)
      .sort({ timestamp: -1 })
      .populate('productId', 'name sku');
      
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
};

// Get a single transaction
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await InventoryTransaction.findById(req.params.id)
      .populate('productId', 'name sku');
      
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction', error: error.message });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { productId, type, quantity, reason } = req.body;
    
    // Validate request
    if (!productId || !type || !quantity) {
      return res.status(400).json({ message: 'productId, type, and quantity are required' });
    }
    
    // Check if product exists
    const product = await Product.findById(productId).session(session);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Create transaction
    const newTransaction = new InventoryTransaction({
      productId,
      type,
      quantity,
      reason: reason || '',
      timestamp: new Date()
    });
    
    // Update product stock
    if (type === 'in') {
      product.currentStock += quantity;
    } else if (type === 'out') {
      // Check if enough stock
      if (product.currentStock < quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Insufficient stock available' });
      }
      product.currentStock -= quantity;
    } else {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Type must be either "in" or "out"' });
    }
    
    // Save both documents
    await newTransaction.save({ session });
    await product.save({ session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json(newTransaction);
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ message: 'Error creating transaction', error: error.message });
  }
};

// Delete a transaction (admin only functionality)
exports.deleteTransaction = async (req, res) => {
  try {
    const deletedTransaction = await InventoryTransaction.findByIdAndDelete(req.params.id);
    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
};
