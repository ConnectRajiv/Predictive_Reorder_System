const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

// GET all alerts (with optional filtering)
router.get('/', alertController.getAlerts);

// PATCH mark an alert as read
router.patch('/:id', alertController.updateAlertStatus);

// DELETE an alert
router.delete('/:id', alertController.deleteAlert);

module.exports = router;
