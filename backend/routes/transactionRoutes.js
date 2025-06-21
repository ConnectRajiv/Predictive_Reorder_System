const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// GET all transactions (with optional filtering)
router.get('/', transactionController.getTransactions);

// POST create a new transaction
router.post('/', transactionController.createTransaction);

// GET a single transaction by ID
router.get('/:id', transactionController.getTransactionById);

// DELETE a transaction (for administrative purposes)
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
