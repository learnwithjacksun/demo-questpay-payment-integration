import { Router } from "express";
import TransactionModel from "../models/transactions.model.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const transactions = await TransactionModel.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = transactions.map((tx) => ({
      id: tx._id.toString(),
      reference: tx.reference,
      amount: tx.amount,
      status: tx.status,
      description: tx.description,
      balanceBefore: tx.balanceBefore,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt,
    }));

    return res.status(200).json({
      success: true,
      transactions: formatted,
    });
  } catch (error) {
    console.error("List transactions error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
});

export default router;
