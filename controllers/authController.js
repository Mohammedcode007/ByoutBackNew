const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Register
const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body; // إضافة role

    // التحقق من وجود الإيميل
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // التحقق من وجود رقم الهاتف
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already used' });
    }

    // إنشاء المستخدم مع role
    const user = await User.create({ name, email, phone, password, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role, // إرجاع الدور أيضًا
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};


// Login
// const authUser = async (req, res, next) => {
//   try {
//     console.log("=== Login Request Received ===");
//     console.log("Request Body:", req.body);

//     const { email, password } = req.body;

//     console.log("Email Received:", email);
//     console.log("Password Received:", password);

//     // البحث عن المستخدم
//     const user = await User.findOne({ email });
//     console.log("User Found:", user ? "YES" : "NO");

//     if (!user) {
//       console.log("Login Failed: Email not found");
//       return res.status(401).json({ message: "Invalid email or password (email)" });
//     }

//     // التأكد من كلمة المرور
//     const isMatch = await user.matchPassword(password);
//     console.log("Password Match:", isMatch ? "YES" : "NO");

//     if (!isMatch) {
//       console.log("Login Failed: Wrong password");
//       return res.status(401).json({ message: "Invalid email or password (password)" });
//     }

//     // إذا تم النجاح
//     console.log("Login Successful for user:", user.email);

//     return res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       role: user.role, // إضافة هذا السطر
//       token: generateToken(user._id)
//     });

//   } catch (err) {
//     console.error("Login Error:", err);
//     next(err);
//   }
// };

const authUser = async (req, res, next) => {
  try {
    console.log("=== Login Request Received ===");
    console.log("Request Body:", req.body);

    const { email, password, latitude, longitude, country, city } = req.body; // أضف الدولة والمدينة

    console.log("Email Received:", email);
    console.log("Password Received:", password);
    console.log("Coordinates Received:", latitude, longitude);
    console.log("Country Received:", country);
    console.log("City Received:", city);

    // البحث عن المستخدم
    const user = await User.findOne({ email });
    console.log("User Found:", user ? "YES" : "NO");

    if (!user) {
      console.log("Login Failed: Email not found");
      return res.status(401).json({ message: "Invalid email or password (email)" });
    }

    // التأكد من كلمة المرور
    const isMatch = await user.matchPassword(password);
    console.log("Password Match:", isMatch ? "YES" : "NO");

    if (!isMatch) {
      console.log("Login Failed: Wrong password");
      return res.status(401).json({ message: "Invalid email or password (password)" });
    }

    // تحديث موقع المستخدم إذا تم إرسال الإحداثيات
    if (latitude != null && longitude != null) {
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude], // ترتيب GeoJSON: [lng, lat]
      };
      console.log("User location will be updated:", user.location);
    }

    // تحديث الدولة والمدينة إذا تم إرسالها
    if (country) {
      user.country = country;
      console.log("User country will be updated:", country);
    }
    if (city) {
      user.city = city;
      console.log("User city will be updated:", city);
    }

    // حفظ التحديثات في قاعدة البيانات
    await user.save();
    console.log("User updated successfully");

    // الرد على العميل
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      country: user.country,
      city: user.city,
      token: generateToken(user._id),
      location: user.location, // إرسال الموقع للموبايل
    });

  } catch (err) {
    console.error("Login Error:", err);
    next(err);
  }
};



// Update User Profile
const updateUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, phone, oldPassword, newPassword, role } = req.body; // إضافة role

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;

    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists && phoneExists._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Phone number already used" });
      }
      user.phone = phone;
    }

    if (role) {
      // تحقق إذا كان المستخدم الحالي لديه صلاحية لتغيير الرول (مثلاً admin)
      user.role = role;
    }

    if (oldPassword && newPassword) {
      const isMatch = await user.matchPassword(oldPassword);
      if (!isMatch) return res.status(401).json({ message: "Old password incorrect" });

      user.password = newPassword; // سيتم عمل hash تلقائي
    }

    await user.save();

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id)
    });

  } catch (err) {
    next(err);
  }
};


module.exports = { registerUser, authUser,updateUser };
