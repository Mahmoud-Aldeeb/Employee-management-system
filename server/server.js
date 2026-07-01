import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
// import multer from "multer";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
// app.use(multer().none());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => res.send("Server is running"));

await connectDB();
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
