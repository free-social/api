import { Request, Response } from "express";
import { WalletService } from "../service/Wallet";

// 1. LOCAL FIX: We define the interface right here.
// This tells TypeScript "req.user" definitely exists in this file.
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export class WalletController {
  /**
   * Create a wallet
   * Body: { amount: number }
   */
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const amount = Number(req.body.amount);
      if (isNaN(amount)) return res.status(400).json({ error: "Invalid amount" });

      const wallet = await WalletService.createWallet(req.user.id, amount);
      res.status(201).json(wallet);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Something went wrong" });
    }
  }

  /**
   * Get wallet summary
   * Calculates total spent and remaining
   */
  static async get(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const wallet = await WalletService.getWallet(req.user.id);
      res.json(wallet);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Something went wrong" });
    }
  }

  /**
   * Update wallet amount
   * Body: { amount: number }
   * If wallet does not exist, creates it
   */
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const amount = Number(req.body.amount);
      if (isNaN(amount)) return res.status(400).json({ error: "Invalid amount" });

      const wallet = await WalletService.updateWallet(req.user.id, amount);
      res.json(wallet);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Something went wrong" });
    }
  }

  /**
   * Delete wallet
   */
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      await WalletService.deleteWallet(req.user.id);
      res.json({ message: "Wallet deleted" });
    } catch (err: any) {
      // Improved error handling: Return 404 if wallet missing
      if (err.message === "Wallet not found") {
        return res.status(404).json({ error: "Wallet not found" });
      }
      res.status(500).json({ error: err.message || "Something went wrong" });
    }
  }
}