// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     phone: { type: String, required: true, unique: true }, // رقم الهاتف
//     password: { type: String, required: true },
//     role: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },

//     favorites: [
//       { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }
//     ]
//   },
//   { timestamps: true }
// );

// // pre-save hook
// userSchema.pre('save', async function () {
//   if (!this.isModified('password')) return;
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// // method للتحقق من الباسورد
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// const User = mongoose.model('User', userSchema);
// module.exports = User;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true }, // رقم الهاتف
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },

    favorites: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Property' }
    ],

    // الموقع الجغرافي للمستخدم (longitude, latitude)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // إضافة الدولة والمدينه
    country: { type: String, required: true },
    city: { type: String, required: true },

  },
  { timestamps: true }
);

// pre-save hook لتشفير الباسورد
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// method للتحقق من الباسورد
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// إنشاء index للموقع لتسهيل البحث الجغرافي
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);
module.exports = User;
