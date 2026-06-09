import { Schema, model } from "mongoose";

const transactionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    description: {
      type: String,
      default: "Wallet top-up",
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
    },
    netAmount: {
      type: Number,
    },
    platformFee: {
      type: Number,
    },
    providerTransactionId: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
    reconciliationNote: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

const TransactionModel = model("Transaction", transactionSchema);

export default TransactionModel;
