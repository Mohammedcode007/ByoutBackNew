// التحقق من أن المستخدم Admin أو Owner
const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'غير مصرح، لم يتم تسجيل الدخول' });
    }

    if (req.user.role === 'admin' || req.user.role === 'owner') {
      return next();
    }

    return res.status(403).json({ message: 'غير مصرح لك بالوصول' });
  } catch (error) {
    next(error);
  }
};

module.exports = { isAdmin };
