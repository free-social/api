import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import User from "../models/User"; // ✅ Import your User model

export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

export const AuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token, authorization denied" });
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    
    // 1. Verify the JWT signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { id: string };

    // ✅ 2. WHITELIST CHECK: Find the user and check their currentToken
    const user = await User.findById(decoded.id);

    // If user doesn't exist or the token in the header doesn't match the one in DB
    if (!user || user.currentToken !== token) {
      res.status(401).json({ error: "Session expired or logged in elsewhere. Please login again." });
      return;
    }

    // 3. Attach user info and proceed
    req.user = { id: decoded.id };
    next();
  } catch (err: any) {
    res.status(401).json({ error: "Unauthorized" });
  }
};