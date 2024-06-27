import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import connectMongoDB from "./db/connectMongoDB.js";
import {v2 as cloudinary} from "cloudinary";


dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); //to parse req.body
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); //to parse form data

app.use("/auth/", authRoutes);
app.use("/users/", userRoutes);
app.use("/posts/", postRoutes);


app.listen(PORT, () => {
  console.log("server running on port", PORT);
  connectMongoDB();
});