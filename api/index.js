import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "../config/db.js";
import authRoutes from "../routes/authRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import propertyRoutes from "../routes/propertyRoutes.js";
import favoriteRoutes from "../routes/favoriteRoutes.js";
import notificationRoutes from "../routes/notificationRoutes.js";
import { errorHandler } from "../middlewares/errorMiddleware.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/notifications", notificationRoutes);

// Error middleware
app.use(errorHandler);

// MongoDB connection caching (Serverless-friendly)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = connectDB(process.env.MONGO_URI).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Connect DB on cold start
dbConnect()
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

export const handler = serverless(app);
