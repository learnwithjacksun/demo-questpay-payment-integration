import process from "process";
import questpay from "../config/questpay.js";
import TransactionModel from "../models/transactions.model.js";
import UserModel from "../models/user.model.js";
import {
  buildReconcileDataFromVerify,
  reconcileFailure,
  reconcilePayment,
  verifyQuestpaySignature,
} from "../services/reconcilePayment.js";

const apiKey =
  process.env.QUESTPAY_API_KEY || process.env.QUESTPAY_SECRET_KEY;

const formatTransaction = (transaction) => ({
  reference: transaction.reference,
  amount: transaction.amount,
  email: transaction.email,
  status: transaction.status,
});

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
    let transaction = await TransactionModel.findOne({ reference });

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
        transaction: formatTransaction(transaction),
      });
    }

    if (transaction.status === "failed") {
      return res.status(200).json({
        success: false,
        message: "Payment was not completed",
        status: "failed",
        transaction: formatTransaction(transaction),
      });
    }

    try {
      const { data: questpayRes } = await questpay.get(
        `/v1/checkout/verify/${reference}`,
      );
      const verifyData = questpayRes?.data;
      const remoteStatus = verifyData?.status;

      if (remoteStatus === "success") {
        const reconcileData = buildReconcileDataFromVerify(
          verifyData,
          transaction,
        );
        await reconcilePayment(reconcileData);
        transaction = await TransactionModel.findOne({ reference });

        if (transaction?.status === "success") {
          return res.status(200).json({
            success: true,
            message: "Payment confirmed",
            status: "success",
            transaction: formatTransaction(transaction),
          });
        }

        return res.status(200).json({
          success: false,
          message: "Payment verification in progress",
          status: "pending",
          transaction: formatTransaction(transaction),
        });
      }

      if (remoteStatus === "failed") {
        await reconcileFailure({ reference });
        transaction = await TransactionModel.findOne({ reference });

        return res.status(200).json({
          success: false,
          message: "Payment was not completed",
          status: "failed",
          transaction: formatTransaction(transaction),
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
      transaction: formatTransaction(transaction),
    });
  } catch (error) {
    console.error("Verify payment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

export const handleQuestpayWebhook = async (req, res) => {
  try {
    if (!verifyQuestpaySignature(req, apiKey)) {
      console.error("[questpay:webhook] signature=fail");
      return res.status(400).send("Invalid signature");
    }

    console.log("[questpay:webhook] signature=pass");

    const event =
      req.headers["x-questpay-event"] || req.body?.event || "unknown";
    const data = req.body?.data;
    const grossAmount = data ? (data.payment?.amountPaid ?? data.fees?.grossAmount ?? data.amount) : undefined;

    console.log(
      `[questpay:webhook] event=${event} reference=${data?.reference ?? "n/a"} amountPaid=${grossAmount ?? "n/a"} netAmount=${data?.fees?.netAmount ?? "n/a"}`,
    );

    if (event === "payment.received" && data?.status === "success") {
      await reconcilePayment(data);
    } else if (event === "checkout.failed") {
      await reconcileFailure(data);
    } else {
      console.warn(`[questpay:webhook] unhandled event=${event}`);
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("[questpay:webhook] error:", error.message);
    return res.status(200).send("OK");
  }
};
