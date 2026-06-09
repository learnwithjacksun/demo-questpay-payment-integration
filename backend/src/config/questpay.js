import axios from "axios";
import process from "process";

const apiKey =
  process.env.QUESTPAY_API_KEY || process.env.QUESTPAY_SECRET_KEY;

const questpay = axios.create({
  baseURL: process.env.QUESTPAY_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  },
});

export default questpay;