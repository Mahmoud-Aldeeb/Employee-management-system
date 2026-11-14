import express from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import { protect, protectAdmin } from "../middleware/auth.js";

const analyticsRouter = express.Router();

// GET /api/analytics — Admin only
analyticsRouter.get("/", protect, protectAdmin, getAnalytics);

export default analyticsRouter;
