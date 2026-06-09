import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import process from "process";
import paymentsRouter from "./routes/payments.route.js";
import transactionsRouter from "./routes/transactions.route.js";
import authRouter from "./routes/auth.routes.js";
import { handleQuestpayWebhook } from "./controllers/payments.controller.js";

const app = express();

const allowedOrigins = ["http://localhost:3000", "http://localhost:3001"];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
};

app.use(cors(corsOptions));

const webhookPath =
  process.env.QUESTPAY_WEBHOOK_PATH || "/webhooks/questpay";
app.post(
  webhookPath,
  express.raw({ type: "application/json" }),
  handleQuestpayWebhook,
);

app.use(express.json());

const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running",
    success: true,
    uptime: process.uptime(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/transactions", transactionsRouter);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
  });
};

startServer();
