// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI); // Options مش محتاجين
//     console.log('MongoDB Connected');
//   } catch (err) {
//     console.error('Failed to connect to MongoDB:', err.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;
import mongoose from "mongoose";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined");
    
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      // بعض الخيارات لتحسين الاستقرار على Serverless
      useNewUrlParser: true,
      useUnifiedTopology: true
    }).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
