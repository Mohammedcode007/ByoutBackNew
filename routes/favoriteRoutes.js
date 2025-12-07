const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

const {
  addFavorite,
  removeFavorite,
  getFavorites
} = require('../controllers/favoriteController');

router.post('/add', protect, addFavorite);
router.post('/remove', protect, removeFavorite);
router.get('/', protect, getFavorites);

module.exports = router;
