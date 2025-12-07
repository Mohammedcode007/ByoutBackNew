const User = require('../models/User');
const Property = require('../models/Property');

const addFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { propertyId } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: "العقار غير موجود" });

    const user = await User.findById(userId);

    if (user.favorites.includes(propertyId)) {
      return res.status(400).json({ message: "العقار موجود بالفعل في المفضلات" });
    }

    user.favorites.push(propertyId);
    await user.save();

    return res.status(200).json({ message: "تمت الإضافة إلى المفضلات بنجاح" });

  } catch (err) {
    return res.status(500).json({ message: "خطأ في الخادم", error: err.message });
  }
};


const removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { propertyId } = req.body;

    const user = await User.findById(userId);

    user.favorites = user.favorites.filter(
      fav => fav.toString() !== propertyId
    );

    await user.save();

    return res.status(200).json({ message: "تم حذف العقار من المفضلة" });

  } catch (err) {
    return res.status(500).json({ message: "خطأ في الخادم", error: err.message });
  }
};


const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("favorites");

    return res.status(200).json({
      count: user.favorites.length,
      favorites: user.favorites
    });

  } catch (err) {
    return res.status(500).json({ message: "خطأ في الخادم", error: err.message });
  }
};


// export default بالطريقة الصحيحة في CommonJS
module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites
};
