const User = require('../models/User');

// ==========================
// إنشاء مستخدم (اختياري)
// ==========================
const createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

// ==========================
// جلب كل المستخدمين + بحث + فلترة + pagination
// ==========================
const getAllUsers = async (req, res, next) => {
  try {
    const { name, role, country, city, page = 1, limit = 10 } = req.query;

    const query = {};

    // البحث بالاسم فقط
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    // البحث بالدور (غير حساس لحالة الأحرف)
    if (role) {
      query.role = { $regex: `^${role}$`, $options: 'i' };
    }

    // فلترة حسب البلد والمدينة (اختياري)
    if (country) query.country = country;
    if (city) query.city = city;

    const skip = (page - 1) * limit;

    console.log('===== Search Parameters =====');
    console.log('Name:', name);
    console.log('Role:', role);
    console.log('Country:', country);
    console.log('City:', city);
    console.log('Page:', page);
    console.log('Limit:', limit);
    console.log('MongoDB Query:', query);
    console.log('=============================');

    const users = await User.find(query)
      .select('-password')
      .skip(Number(skip))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    console.log('Total Users Found:', total);
    console.log('Users Returned:', users.length);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      results: users
    });
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    next(err);
  }
};



// ==========================
// جلب مستخدم واحد
// ==========================
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ==========================
// تعديل مستخدم
// ==========================
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // التحقق من role إذا موجود
    if (updates.role && !['user','admin','owner'].includes(updates.role)) {
      return res.status(400).json({ message: 'قيمة الدور غير صالحة' });
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({
      message: 'تم التحديث بنجاح',
      user: updatedUser
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};


// ==========================
// حذف مستخدم
// ==========================
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    await user.deleteOne();

    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (err) {
    next(err);
  }
};

// ==========================
// تصدير الكونترولر
// ==========================
module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
