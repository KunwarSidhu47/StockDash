const express = require('express');
const router = express.Router();
const Watchlist = require('../models/Watchlist');

// GET /api/watchlist
router.get('/', async (req, res) => {
  try {
    const watchlist = await Watchlist.find().sort({ addedAt: -1 });
    res.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// POST /api/watchlist
router.post('/', async (req, res) => {
  try {
    const { symbol, companyName } = req.body;
    
    if (!symbol || !companyName) {
      return res.status(400).json({ error: 'Symbol and companyName are required' });
    }

    // Check if already exists
    const existing = await Watchlist.findOne({ symbol: symbol.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }

    const newEntry = new Watchlist({ symbol, companyName });
    await newEntry.save();
    
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// DELETE /api/watchlist/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEntry = await Watchlist.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      return res.status(404).json({ error: 'Watchlist entry not found' });
    }

    res.json({ message: 'Removed from watchlist successfully', deletedEntry });
  } catch (error) {
    console.error('Error deleting from watchlist:', error);
    res.status(500).json({ error: 'Failed to delete from watchlist' });
  }
});

module.exports = router;
