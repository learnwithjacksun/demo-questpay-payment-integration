import jwt from "jsonwebtoken";
import process from "process";
import UserModel from "../models/user.model.js";

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      balance: user.balance,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
