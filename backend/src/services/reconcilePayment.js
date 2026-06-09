import crypto from "crypto";
import { Buffer } from "buffer";
import TransactionModel from "../models/transactions.model.js";
import UserModel from "../models/user.model.js";

const timingSafeEqual = (a, b) => {
  const expected = Buffer.from(a, "utf8");
  const received = Buffer.from(String(b), "utf8");
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
};

export const verifyQuestpaySignature = (req, apiKey) => {
  const signature = req.headers["x-questpay-signature"];
  if (!signature || !apiKey) return false;

  const payload = JSON.stringify(req.body);
  const calculated = crypto
    .createHmac("sha256", apiKey)
    .update(payload)
    .digest("hex");

  return timingSafeEqual(calculated, signature);
};

export const getGrossAmount = (data) =>
  data.payment?.amountPaid ?? data.fees?.grossAmount ?? data.amount;

const logReconcile = (outcome, details = {}) => {
  const parts = Object.entries(details)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  console.log(`[questpay:reconcile] outcome=${outcome}${parts ? ` ${parts}` : ""}`);
};

export const reconcilePayment = async (data) => {
  const reference = data.reference;
  if (!reference) {
    logReconcile("missing_reference");
    return { outcome: "missing_reference" };
  }

  const existing = await TransactionModel.findOne({ reference });

  if (existing?.status === "success") {
    logReconcile("already_processed", { reference });
    return { outcome: "already_processed", reference };
  }

  if (!existing || existing.status !== "pending") {
    logReconcile("order_not_found", { reference });
    return { outcome: "order_not_found", reference };
  }

  const grossAmount = getGrossAmount(data);
  if (Math.abs(existing.amount - grossAmount) > 0) {
    existing.reconciliationNote = "amount_mismatch";
    await existing.save();
    logReconcile("amount_mismatch", {
      reference,
      expected: existing.amount,
      got: grossAmount,
    });
    return { outcome: "amount_mismatch", reference };
  }

  const metadataUserId = data.metadata?.userId;
  if (metadataUserId && String(metadataUserId) !== String(existing.userId)) {
    existing.reconciliationNote = "user_mismatch";
    await existing.save();
    logReconcile("user_mismatch", { reference, metadataUserId });
    return { outcome: "user_mismatch", reference };
  }

  const user = await UserModel.findById(existing.userId);
  if (!user) {
    logReconcile("user_not_found", { reference, userId: existing.userId });
    return { outcome: "user_not_found", reference };
  }

  const balanceBefore = user.balance;
  const amountPaid = data.payment?.amountPaid ?? grossAmount;
  const netAmount = data.fees?.netAmount ?? null;
  const platformFee = data.fees?.platformFee ?? null;
  const providerTransactionId = data.payment?.providerTransactionId ?? null;

  const claimed = await TransactionModel.findOneAndUpdate(
    { reference, status: "pending" },
    {
      $set: {
        status: "success",
        amount: grossAmount,
        amountPaid,
        netAmount,
        platformFee,
        providerTransactionId,
        balanceBefore,
        processedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!claimed) {
    const current = await TransactionModel.findOne({ reference });
    if (current?.status === "success") {
      logReconcile("already_processed", { reference });
      return { outcome: "already_processed", reference };
    }
    logReconcile("order_not_found", { reference });
    return { outcome: "order_not_found", reference };
  }

  const updatedUser = await UserModel.creditBalance(user.id, grossAmount);

  await TransactionModel.findByIdAndUpdate(claimed._id, {
    $set: { balanceAfter: updatedUser.balance },
  });

  logReconcile("credited", {
    reference,
    userId: user.id,
    gross: grossAmount,
    netAmount: netAmount ?? "",
    platformFee: platformFee ?? "",
  });

  return {
    outcome: "credited",
    reference,
    userId: user.id,
    grossAmount,
  };
};

export const reconcileFailure = async (data) => {
  const reference = data.reference;
  if (!reference) {
    logReconcile("missing_reference");
    return { outcome: "missing_reference" };
  }

  const transaction = await TransactionModel.findOne({ reference });
  if (!transaction) {
    logReconcile("order_not_found", { reference });
    return { outcome: "order_not_found", reference };
  }

  if (transaction.status === "success") {
    logReconcile("already_processed", { reference });
    return { outcome: "already_processed", reference };
  }

  if (transaction.status === "failed") {
    logReconcile("already_failed", { reference });
    return { outcome: "already_failed", reference };
  }

  await TransactionModel.findOneAndUpdate(
    { reference, status: "pending" },
    { $set: { status: "failed", processedAt: new Date() } },
  );

  logReconcile("failed", { reference });
  return { outcome: "failed", reference };
};

export const buildReconcileDataFromVerify = (verifyData, transaction) => ({
  reference: transaction.reference,
  amount: verifyData.amount ?? transaction.amount,
  status: "success",
  customer: { email: transaction.email },
  metadata: { userId: transaction.userId },
  payment: {
    amountPaid:
      verifyData.payment?.amountPaid ??
      verifyData.fees?.grossAmount ??
      verifyData.amount ??
      transaction.amount,
    providerTransactionId: verifyData.payment?.providerTransactionId,
  },
  fees: verifyData.fees,
  checkout: verifyData.checkout,
});
