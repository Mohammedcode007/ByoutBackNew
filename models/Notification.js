const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // المستلمين
  relatedItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }, // العنصر المرتبط
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // من قرأ الإشعار
  status: { 
    type: String, 
    enum: ['new', 'read'], // يمكن إضافة حالات أخرى حسب الحاجة
    default: 'new' 
  },
  createdAt: { type: Date, default: Date.now }
});

// دالة instance لتعليم الإشعار كمقروء لمستخدم معين
notificationSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    if (this.readBy.length === this.recipients.length) {
      this.status = 'read'; // جميع المستلمين قرأوا الإشعار
    }
    await this.save();
  }
  return this;
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
