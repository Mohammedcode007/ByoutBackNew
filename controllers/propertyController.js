const Property = require('../models/Property');
const mongoose = require('mongoose');

// إضافة عقار
const addProperty = async (req, res, next) => {
  try {
    const ownerId = req.user._id; // من JWT
    const propertyData = req.body;

    const property = await Property.create({ ...propertyData, owner: ownerId });
    res.status(201).json(property);
  } catch (err) {
    next(err);
  }
};

// تعديل عقار
const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid property ID" });

    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    // التأكد أن المستخدم هو المالك
    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this property" });
    }

    Object.assign(property, req.body); // تحديث الحقول المرسلة
    await property.save();

    res.json(property);
  } catch (err) {
    next(err);
  }
};

// حذف عقار
// حذف عقار
const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid property ID" });

    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    if (property.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this property" });
    }

    await Property.findByIdAndDelete(id); // ✅ استخدام هذه الطريقة أفضل من remove()
    
    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    console.error(err); // طباعة الخطأ للتصحيح
    next(err);
  }
};


// جلب عقار واحد
const getProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid property ID" });

    const property = await Property.findById(id).populate('owner', 'name email phone');
    if (!property) return res.status(404).json({ message: "Property not found" });

    res.json(property);
  } catch (err) {
    next(err);
  }
};

// جلب كل العقارات مع فلترة بسيطة




const getAllProperties = async (req, res, next) => {
  try {
    const { 
      type, 
      transactionType, 
      country,
      city, 
      district,
      lat, 
      lng, 
      radiusKm, // نصف القطر بالكيلومتر للبحث الجغرافي
      featured, 
      status, 
      bedrooms, 
      bathrooms,
      'price[from]': priceFrom, 
      'price[to]': priceTo,
      'area[from]': areaFrom,
      'area[to]': areaTo,
      deliveryMonth,
      deliveryYear,
      installmentMonths
    } = req.query;

    const filter = {};

    // فلاتر أساسية
    if (type) filter.type = type;
    if (transactionType) filter.transactionType = transactionType;
    if (country && country.trim() !== '') filter['location.country'] = country.trim();
if (city && city.trim() !== '') filter['location.city'] = city.trim();
if (district && district.trim() !== '') filter['location.district'] = district.trim();

    if (featured) filter.featured = featured === 'true';
    if (status) filter.status = status;

    // فلترة عدد الغرف
    if (bedrooms) {
      if (typeof bedrooms === 'string' && bedrooms.endsWith('+')) {
        filter.bedrooms = { $gte: Number(bedrooms.replace('+', '')) };
      } else filter.bedrooms = Number(bedrooms);
    }

    // فلترة عدد الحمامات
    if (bathrooms) {
      if (typeof bathrooms === 'string' && bathrooms.endsWith('+')) {
        filter.bathrooms = { $gte: Number(bathrooms.replace('+', '')) };
      } else filter.bathrooms = Number(bathrooms);
    }

    // فلترة السعر
    if (priceFrom || priceTo) {
      filter.price = {};
      if (priceFrom) filter.price.$gte = Number(priceFrom);
      if (priceTo) filter.price.$lte = Number(priceTo);
    }

    // فلترة المساحة
    if (areaFrom || areaTo) {
      filter.area = {};
      if (areaFrom) filter.area.$gte = Number(areaFrom);
      if (areaTo) filter.area.$lte = Number(areaTo);
    }

    // فلترة تاريخ التسليم
    if (deliveryMonth && deliveryYear) {
      const month = Number(deliveryMonth) - 1;
      const year = Number(deliveryYear);
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      filter.deliveryDate = { $gte: startDate, $lte: endDate };
    }

    // فلترة التقسيط
    if (installmentMonths && Number(installmentMonths) > 0) {
      filter.installmentMonths = Number(installmentMonths);
    }

    // فلترة حسب الإحداثيات (بحث قرب نقطة)
    if (lat && lng && radiusKm) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      const radiusMeters = Number(radiusKm) * 1000;
      filter['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [[lngNum, latNum], radiusMeters / 6378137] // نصف قطر الأرض بالراديان
        }
      };
    }

    const properties = await Property.find(filter).populate('owner', 'name email phone');
    res.json(properties);
  } catch (err) {
    next(err);
  }
};


module.exports = {
  addProperty,
  updateProperty,
  deleteProperty,
  getProperty,
  getAllProperties
};
