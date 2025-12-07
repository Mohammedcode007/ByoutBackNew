const express = require('express');
const { registerUser, authUser,updateUser } = require('../controllers/authController');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.put('/update', protect, updateUser); // << مسار التحديث الجديد

module.exports = router;
