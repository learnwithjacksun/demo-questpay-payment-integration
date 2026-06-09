import crypto from "crypto";
import process from "process";
import questpay from "../config/questpay.js";
import TransactionModel from "../models/transactions.model.js";
import UserModel from "../models/user.model.js";
import { Buffer } from "buffer";

const apiKey =
  process.env.QUESTPAY_API_KEY || process.env.QUESTPAY_SECRET_KEY;

export const initiatePayment = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (!amount || amount < 99) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be at least 99" });
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const reference = `TOPUP-${user.id}-${Date.now()}`;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    await TransactionModel.create({
      userId: user.id,
      email: user.email,
      amount,
      reference,
      status: "pending",
      description: "Wallet top-up",
      balanceBefore: user.balance,
      balanceAfter: user.balance,
    });

    const { data: questpayRes } = await questpay.post(
      "/v1/checkout/initialize",
      {
        reference,
        email: user.email,
        amount,
        description: "Wallet top-up",
        metadata: { userId: user.id },
        return_url: `${clientUrl}/payment/callback`,
      },
    );

    const checkoutUrl = questpayRes?.data?.checkout_url;
    if (!checkoutUrl) {
      return res.status(502).json({
        success: false,
        message: "Failed to initialize checkout",
      });
    }

    return res.status(200).json({
      success: true,
      checkout_url: checkoutUrl,
      reference,
    });
  } catch (error) {
    console.error(
      "Initiate payment error:",
      error.response?.data || error.message,
    );
    return res.status(500).json({
      success: false,
      message: "Failed to initiate payment",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const transaction = await TransactionModel.findOne({ reference });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
        status: "failed",
      });
    }

    if (transaction.status === "success") {
      return res.status(200).json({
        success: true,
        message: "Payment confirmed",
        status: "success",
        transaction: {
          reference: transaction.reference,
          amount: transaction.amount,
          email: transaction.email,
          status: transaction.status,
        },
      });
    }

    if (transaction.status === "failed") {
      return res.status(200).json({
        success: false,
        message: "Payment was not completed",
        status: "failed",
        transaction: {
          reference: transaction.reference,
          amount: transaction.amount,
          email: transaction.email,
          status: transaction.status,
        },
      });
    }

    try {
      const { data: questpayRes } = await questpay.get(
        `/v1/checkout/verify/${reference}`,
      );
      const remoteStatus = questpayRes?.data?.status;

      if (remoteStatus === "success") {
        return res.status(200).json({
          success: true,
          message: "Payment confirmed",
          status: "success",
          transaction: {
            reference: transaction.reference,
            amount: transaction.amount,
            email: transaction.email,
            status: "pending",
          },
        });
      }

      if (remoteStatus === "failed") {
        return res.status(200).json({
          success: false,
          message: "Payment was not completed",
          status: "failed",
          transaction: {
            reference: transaction.reference,
            amount: transaction.amount,
            email: transaction.email,
            status: "failed",
          },
        });
      }
    } catch (verifyError) {
      console.error(
        "Questpay verify error:",
        verifyError.response?.data || verifyError.message,
      );
    }

    return res.status(200).json({
      success: false,
      message: "Payment is still pending",
      status: "pending",
      transaction: {
        reference: transaction.reference,
        amount: transaction.amount,
        email: transaction.email,
        status: transaction.status,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

const timingSafeEqual = (a, b) => {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const creditUserFromWebhook = async (data) => {
  const reference = data.reference;
  const existing = await TransactionModel.findOne({ reference });

  if (existing?.status === "success") {
    return { duplicate: true };
  }

  const userId = data.metadata?.userId;
  let user = userId ? await UserModel.findById(userId) : null;

  if (!user && data.customer?.email) {
    user = await UserModel.findOne({
      email: data.customer.email.toLowerCase(),
    });
  }

  if (!user) {
    console.error("Webhook: user not found for reference", reference);
    return { error: "user_not_found" };
  }

  const creditAmount = data.fees?.netAmount ?? data.amount;
  const balanceBefore = user.balance;

  await UserModel.creditBalance(user.id, creditAmount);
  const updatedUser = await UserModel.findById(user.id);

  if (existing) {
    existing.status = "success";
    existing.amount = creditAmount;
    existing.balanceBefore = balanceBefore;
    existing.balanceAfter = updatedUser.balance;
    await existing.save();
  } else {
    await TransactionModel.create({
      userId: user.id,
      email: user.email,
      amount: creditAmount,
      reference,
      status: "success",
      description: data.checkout?.description || "Wallet top-up",
      balanceBefore,
      balanceAfter: updatedUser.balance,
    });
  }

  return { credited: true, userId: user.id, amount: creditAmount };
};

const failCheckout = async (data) => {
  const reference = data.reference;
  const transaction = await TransactionModel.findOne({ reference });
  if (!transaction || transaction.status === "success") return;

  transaction.status = "failed";
  await transaction.save();
};

export const handleQuestpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-questpay-signature"];
    const payload = req.body.toString("utf8");

    if (!signature || !apiKey) {
      console.error("Webhook: missing signature or API key");
      return res.status(400).send("Invalid signature");
    }

    const calculated = crypto
      .createHmac("sha256", apiKey)
      .update(payload)
      .digest("hex");

    if (!timingSafeEqual(calculated, signature)) {
      console.error("Webhook: invalid signature");
      return res.status(400).send("Invalid signature");
    }

    const body = JSON.parse(payload);
    const { event, data } = body;

    if (event === "payment.received" && data?.status === "success") {
      await creditUserFromWebhook(data);
    } else if (event === "checkout.failed") {
      await failCheckout(data);
    } else {
      console.warn("Webhook: unhandled event", event);
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(500).send("Webhook processing failed");
  }
};
