const express = require('express');
const Vegetable = require('../models/Vegetable');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

/**
 * GET /api/vegetables — Get all vegetables
 */
router.get('/', async (req, res) => {
  try {
    const vegetables = await Vegetable.find().sort({ name: 1 });
    res.json(vegetables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vegetables' });
  }
});

/**
 * POST /api/vegetables — Add new vegetable
 */
router.post('/', async (req, res) => {
  try {
    const { name, emoji, pricePerKg, unit, availableToday, stock, lowStockThreshold } = req.body;

    if (!name || pricePerKg === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const vegetable = new Vegetable({
      name,
      emoji: emoji || '🥬',
      pricePerKg,
      unit: unit || 'kg',
      availableToday: availableToday || false,
      stock: stock || 0,
      lowStockThreshold: lowStockThreshold || 5,
    });

    await vegetable.save();
    res.status(201).json(vegetable);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Vegetable already exists' });
    }
    res.status(500).json({ error: 'Failed to add vegetable' });
  }
});

/**
 * PUT /api/vegetables/:id — Update vegetable
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, emoji, pricePerKg, unit, availableToday, stock, lowStockThreshold } = req.body;

    const vegetable = await Vegetable.findByIdAndUpdate(
      req.params.id,
      { name, emoji, pricePerKg, unit, availableToday, stock, lowStockThreshold },
      { new: true, runValidators: true }
    );

    if (!vegetable) {
      return res.status(404).json({ error: 'Vegetable not found' });
    }

    res.json(vegetable);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vegetable' });
  }
});

/**
 * DELETE /api/vegetables/:id — Delete vegetable
 */
router.delete('/:id', async (req, res) => {
  try {
    const vegetable = await Vegetable.findByIdAndDelete(req.params.id);
    if (!vegetable) {
      return res.status(404).json({ error: 'Vegetable not found' });
    }
    res.json({ message: 'Vegetable deleted', vegetable });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vegetable' });
  }
});

/**
 * PATCH /api/vegetables/toggle-all — Set all vegetables to available/unavailable
 * NOTE: This must come BEFORE /:id/toggle to avoid Express matching "toggle-all" as an :id
 */
router.patch('/toggle-all', async (req, res) => {
  try {
    const { available } = req.body;
    await Vegetable.updateMany({}, { availableToday: !!available });
    const vegetables = await Vegetable.find().sort({ name: 1 });
    res.json(vegetables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle all vegetables' });
  }
});

/**
 * PATCH /api/vegetables/:id/toggle — Toggle available today
 */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const vegetable = await Vegetable.findById(req.params.id);
    if (!vegetable) {
      return res.status(404).json({ error: 'Vegetable not found' });
    }

    vegetable.availableToday = !vegetable.availableToday;
    await vegetable.save();

    res.json(vegetable);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle vegetable' });
  }
});

module.exports = router;
