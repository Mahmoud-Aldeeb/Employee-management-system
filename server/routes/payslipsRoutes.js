import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import {
  createPayslip,
  getPayslip,
  getPayslipById,
} from "../controllers/payslipController.js";

const payslipRouter = Router();

payslipRouter.get("/", protect, getPayslip);
payslipRouter.get("/:id", protect, getPayslipById);
payslipRouter.post("/", protect, protectAdmin, createPayslip);

export default payslipRouter;
