const Alert = require('../models/Alert');

// Get all alerts with optional filtering
exports.getAlerts = async (req, res) => {
  try {
    const filter = {};
    
    // Apply filters if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.productId) {
      filter.productId = req.query.productId;
    }
    
    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .populate('productId', 'name sku');
      
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
};

// Mark an alert as read
exports.updateAlertStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['new', 'read', 'addressed'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required (new, read, or addressed)' });
    }
    
    const updatedAlert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!updatedAlert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.status(200).json(updatedAlert);
  } catch (error) {
    res.status(400).json({ message: 'Error updating alert', error: error.message });
  }
};

// Delete an alert
exports.deleteAlert = async (req, res) => {
  try {
    const deletedAlert = await Alert.findByIdAndDelete(req.params.id);
    
    if (!deletedAlert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.status(200).json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting alert', error: error.message });
  }
};
