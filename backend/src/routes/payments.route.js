import { Router } from "express";
import {
  initiatePayment,
  verifyPayment,
} from "../controllers/payments.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/initiate", requireAuth, initiatePayment);
router.get("/verify/:reference", verifyPayment);

export default router;
