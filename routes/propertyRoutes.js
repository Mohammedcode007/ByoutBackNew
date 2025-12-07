// routes/propertyRoutes.js
const express = require('express');
const router = express.Router();
const {
  addProperty,
  updateProperty,
  deleteProperty,
  getProperty,
  getAllProperties
} = require('../controllers/propertyController'); // هتعمله بنفس طريقة authController
const { protect } = require('../middlewares/authMiddleware');

// إضافة عقار
router.post('/', protect, addProperty);

// تعديل عقار
router.put('/:id', protect, updateProperty);

// حذف عقار
router.delete('/:id', protect, deleteProperty);

// جلب عقار واحد
router.get('/:id', getProperty);

// جلب كل العقارات
router.get('/', getAllProperties);

module.exports = router;
