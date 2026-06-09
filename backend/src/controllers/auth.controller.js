import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import process from "process";

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const formatUser = (user) => ({
  id: user.id,
  email: user.email,
  balance: user.balance,
});

export const signup = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    const user = await UserModel.create({ email });
    const token = signToken(user.id);

    return res.status(201).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create account" });
  }
};

export const login = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const token = signToken(user.id);

    return res.status(200).json({
      success: true,
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to log in" });
  }
};

export const me = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    console.error("Me error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile" });
  }
};
