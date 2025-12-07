const Notification = require('../models/Notification');
const User = require('../models/User');
const admin = require('firebase-admin');

/**
 * إرسال إشعار لمستخدمين محددين
 * فقط admin أو owner يمكنهم الإرسال
 * body: { title, message, recipientIds: [], relatedItemId }
 */


const sendPushNotification = async (tokens, title, message) => {
  if (!tokens.length) return;

  const payload = {
    notification: { title, body: message },
    data: { type: 'notification' }
  };

  try {
    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log('Push Notification sent:', response);
  } catch (err) {
    console.error('Push Notification Error:', err);
  }
};

// ===================== إرسال إشعار =====================
const sendNotification = async (req, res) => {
  try {
    const { title, message, recipientIds, relatedItemId } = req.body;
    const currentUser = req.user;

    if (!currentUser || !['admin', 'owner'].includes(currentUser.role)) {
      return res.status(403).json({ message: 'ليس لديك صلاحية إرسال الإشعارات' });
    }

    if (!title || !message || !recipientIds?.length) {
      return res.status(400).json({ message: 'يرجى تقديم العنوان، الرسالة والمستلمين' });
    }

    // حفظ الإشعار داخليًا في قاعدة البيانات
    const notification = await Notification.create({
      title,
      message,
      recipients: recipientIds,
      relatedItem: relatedItemId || null
    });

    // جلب Device Tokens للمستلمين
    const users = await User.find({ _id: { $in: recipientIds } });
    const tokens = users.map(u => u.deviceToken).filter(t => t); // deviceToken يجب تخزينه عند تسجيل المستخدم

    // إرسال Push Notification لكل الأجهزة
    await sendPushNotification(tokens, title, message);

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال الإشعار' });
  }
};


// const sendNotification = async (req, res) => {
//   try {
//     const { title, message, recipientIds, relatedItemId } = req.body;

//     // تحقق من صلاحية المستخدم
//     const currentUser = req.user; // افترض أنك تستخدم protect middleware وتضيف user للـ req
//     if (!currentUser || !['admin', 'owner'].includes(currentUser.role)) {
//       return res.status(403).json({ message: 'ليس لديك صلاحية إرسال الإشعارات' });
//     }

//     if (!title || !message || !recipientIds || !recipientIds.length) {
//       return res.status(400).json({ message: 'يرجى تقديم العنوان، الرسالة والمستلمين' });
//     }

//     const notification = await Notification.create({
//       title,
//       message,
//       recipients: recipientIds,
//       relatedItem: relatedItemId || null
//     });

//     res.status(201).json({ success: true, notification });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'حدث خطأ أثناء إرسال الإشعار' });
//   }
// };

/**
 * عرض كل الإشعارات (admin/owner)
 */
const getAllNotifications = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser || !['admin', 'owner'].includes(currentUser.role)) {
      return res.status(403).json({ message: 'ليس لديك صلاحية عرض جميع الإشعارات' });
    }

    const notifications = await Notification.find()
      .populate('recipients', 'name email phone')
      .populate('relatedItem', 'title type price')
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الإشعارات' });
  }
};

/**
 * حذف إشعار محدد (admin/owner)
 * params: notificationId
 */
const deleteNotification = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser || !['admin', 'owner'].includes(currentUser.role)) {
      return res.status(403).json({ message: 'ليس لديك صلاحية حذف الإشعارات' });
    }

    const { notificationId } = req.params;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'الإشعار غير موجود' });
    }

    await notification.remove();
    res.json({ success: true, message: 'تم حذف الإشعار بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الإشعار' });
  }
};

/**
 * جلب إشعارات مستخدم محدد
 * params: userId
 * أو باستخدام req.user لجلب إشعارات المستخدم الحالي
 */
const getUserNotifications = async (req, res) => {
  try {
const userId = req.params.userId || req.user._id;

    const notifications = await Notification.find({ recipients: userId })
      .populate('relatedItem', 'title type price')
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب إشعارات المستخدم' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ message: 'الإشعار غير موجود' });

    await notification.markAsRead(userId);

    res.json({ success: true, notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث حالة الإشعار' });
  }
};

module.exports = {
  sendNotification,
  getAllNotifications,
  deleteNotification,
  getUserNotifications,
  markNotificationAsRead
};
