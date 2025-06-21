const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Predictive Reorder System API' });
});

// Product routes
app.get('/api/products', (req, res) => {
  // Provide sample data instead of an empty array
  const sampleProducts = [
    { id: 1, name: 'Product 1', price: 19.99, stock: 100, threshold: 20 },
    { id: 2, name: 'Product 2', price: 29.99, stock: 50, threshold: 10 },
    { id: 3, name: 'Product 3', price: 39.99, stock: 75, threshold: 15 }
  ];
  res.json(sampleProducts);
});

app.post('/api/products', (req, res) => {
  // TODO: Implement adding new product
  res.status(201).json({ message: 'Product created successfully' });
});

app.get('/api/products/:id', (req, res) => {
  // TODO: Implement fetching a single product
  res.json({ id: req.params.id, name: 'Example Product' });  // Return product directly
});

app.put('/api/products/:id', (req, res) => {
  // TODO: Implement updating a product
  res.json({ message: 'Product updated successfully' });
});

app.delete('/api/products/:id', (req, res) => {
  // TODO: Implement deleting a product
  res.json({ message: 'Product deleted successfully' });
});

// Transaction routes
app.get('/api/transactions', (req, res) => {
  const sampleTransactions = [
    { id: 1, productId: 1, quantity: 10, type: 'sale', date: new Date() },
    { id: 2, productId: 2, quantity: 5, type: 'restock', date: new Date() }
  ];
  res.json(sampleTransactions);
});

// Prediction routes
app.get('/api/predictions', (req, res) => {
  const samplePredictions = [
    { id: 1, productId: 1, predictedQuantity: 30, confidence: 0.85, date: new Date() },
    { id: 2, productId: 2, predictedQuantity: 15, confidence: 0.75, date: new Date() }
  ];
  res.json(samplePredictions);
});

// Alert routes
app.get('/api/alerts', (req, res) => {
  const sampleAlerts = [
    { id: 1, productId: 1, message: 'Low stock warning', severity: 'warning', date: new Date() },
    { id: 2, productId: 3, message: 'Reorder recommended', severity: 'info', date: new Date() }
  ];
  res.json(sampleAlerts);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
