const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  sendNotification,
  getAllNotifications,
  deleteNotification,
  getUserNotifications,
  markNotificationAsRead
} = require('../controllers/notificationController');

const router = express.Router();

// إرسال إشعار لمستخدمين محددين (admin/owner فقط)
router.post('/send', protect, sendNotification);

// جلب كل الإشعارات (admin/owner فقط)
router.get('/', protect, getAllNotifications);

// حذف إشعار محدد (admin/owner فقط)
router.delete('/:notificationId', protect, deleteNotification);

// جلب إشعارات المستخدم الحالي
router.get('/user', protect, getUserNotifications);

// جلب إشعارات مستخدم محدد (admin فقط)
router.get('/user/:userId', protect, getUserNotifications);

// تعليم إشعار كمقروء
router.post('/:notificationId/read', protect, markNotificationAsRead);

module.exports = router;
