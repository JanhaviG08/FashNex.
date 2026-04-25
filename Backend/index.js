import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import weatherRoutes  from './routes/weatherRoutes.js'
import wardrobeRoutes from './routes/wardrobeRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'   

dotenv.config();
 
const app = express();
const port = process.env.PORT || 6000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}))

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/product",productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);

app.use('/api/weather',         weatherRoutes)
app.use('/api/recommendations', weatherRoutes)   // same router handles /recommendations/weather
app.use('/api/wardrobe',        wardrobeRoutes)
app.use('/api/wishlist',        wishlistRoutes)   

// Connect DB FIRST
await connectDb();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});