import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
} from "../controllers/leaveController.js";

const leaveRouter = Router();

leaveRouter.route("/").post(protect, createLeave).get(protect, getLeaves);

leaveRouter.route("/:id").patch(protect, protectAdmin, updateLeaveStatus);

export default leaveRouter;
