const Notification = require('../models/Notification');
const User = require('../models/User');
const admin = require('firebase-admin');
const { sendPushNotification } = require('../services/notificationsService'); // المسار حسب مشروعك

/**
 * إرسال إشعار لمستخدمين محددين
 * فقط admin أو owner يمكنهم الإرسال
 * body: { title, message, recipientIds: [], relatedItemId }
 */




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

    // حفظ الإخطار داخل DB
    const notification = await Notification.create({
      title,
      message,
      recipients: recipientIds,
      relatedItem: relatedItemId || null
    });

    // جلب المستخدمين والتوكنات
    const users = await User.find({ _id: { $in: recipientIds } });
    const tokens = users.map(u => u.deviceToken).filter(t => t);

    console.log('👥 عدد المستخدمين المجلوبين:', users.length);
    users.forEach(u => console.log(` - user ${u._id} token: ${u.deviceToken || '❌ لا يوجد'}`));

    // إرسال عبر Expo
    const results = await sendPushNotification(tokens, title, message, { notificationId: notification._id?.toString() });

    // تنظيف التوكنات غير الصالحة من DB
    // افحص الأخطاء وابحث عن رسائل خطأ نموذجية مثل "DeviceNotRegistered" أو "InvalidCredentials" أو "ExpoPushToken[xxxxxxxx] is not a registered push notification recipient"
    const invalidTokens = new Set();
    results.failures.forEach(f => {
      const token = f.token;
      const r = f.result;
      // حالات شائعة: r.details?.error, r.message, r.length > 0...
      // سنبحث نصيًا عن دلائل على أن التوكن غير صالح
      const msg = JSON.stringify(r).toLowerCase();
      if (msg.includes('not registered') || msg.includes('device not registered') || msg.includes('invalid') || msg.includes('unknown token')) {
        invalidTokens.add(token);
      }
    });

    if (invalidTokens.size) {
      console.log('🧹 إزالة التوكنات غير الصالحة من المستخدمين:', Array.from(invalidTokens));
      await User.updateMany(
        { deviceToken: { $in: Array.from(invalidTokens) } },
        { $unset: { deviceToken: "" } }
      );
    }

    res.status(201).json({ success: true, notification, resultsSummary: { sent: results.success.length, failed: results.failures.length } });
  } catch (error) {
    console.error('❌ sendNotification error:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال الإشعار' });
  }
};


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
