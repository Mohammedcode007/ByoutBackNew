const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
function generateShortId(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
const propertySchema = mongoose.Schema(
  
  {
    uniqueId: {
      type: String,
      unique: true,
      default: () => generateShortId(10), // معرف قصير ثابت للعقار
    },
    title: { type: String, required: true }, // عنوان العقار
    description: { type: String }, // وصف مفصل
    type: {
      type: String,
      enum: ['apartment', 'villa', 'room', 'student_housing'],
      required: true
    }, // نوع العقار
    installmentMonths: { type: Number, default: 0 }, // عدد أشهر التقسيط، 0 يعني لا يوجد تقسيط

    transactionType: {
      type: String,
      enum: ['للبيع', 'للايجار'],
      required: true
    }, // بيع أو إيجار
    price: { type: Number, required: true }, // السعر رقم واحد

    advancePayment: { type: Number }, // المقدم
    location: {
      country: { type: String, required: true, default: 'مصر' }, // الدولة ثابتة
      city: { type: String, required: true }, // المدينة
      district: { type: String, required: true }, // المركز / الحي
      street: { type: String }, // الشارع
      postalCode: { type: String }, // الرمز البريدي
      address: { type: String, required: true }, // العنوان كتابيًا
      coordinates: { // خطوط الطول والعرض
        lat: { type: Number },
        lng: { type: Number }
      }
    },
    suitableFor: {
      type: String,
      enum: ['male', 'female', 'mixed'],
      default: 'mixed'
    }, // تحديد السكن (رجال / بنات / مختلط)
    area: { type: Number }, // مساحة العقار بالمتر
    bedrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    furnished: { type: Boolean, default: false }, // مفروش أو لا
    contact: {
      phone: { type: String },
      email: { type: String }
    },
    deliveryDate: { type: Date }, // تاريخ التسليم
    featured: { type: Boolean, default: false }, // مميز أو استثنائي
    status: {
      type: String,
      enum: ['مكتمل', 'قيد الانشاء',"ready" ,"under_construction"],
      default: 'مكتمل'
    }, // جاهز أو تحت الانشاء
    ownership: {
      type: String,
      enum: ['owned', 'rented', 'student_housing'],
      default: 'owned'
    }, // الملكية أو سكن الطلاب
    amenities: {
      water: { type: Boolean, default: false },
      electricity: { type: Boolean, default: false },
      sauna: { type: Boolean, default: false },
      jacuzzi: { type: Boolean, default: false },
      childcare: { type: Boolean, default: false },
      steam: { type: Boolean, default: false },
      garbage_disposal: { type: Boolean, default: false },
      phone_line: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
      cafeteria: { type: Boolean, default: false },
      maintenance: { type: Boolean, default: false },
      pool: { type: Boolean, default: false },
      gym: { type: Boolean, default: false },
      hospital: { type: Boolean, default: false }
    },
    images: [{ type: String }], // روابط الصور
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // المالك
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },
    addedAt: { type: Date, default: Date.now } // تاريخ الإضافة
  },
  { timestamps: true }
);

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;
