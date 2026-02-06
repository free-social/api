import { Request, Response } from "express";
import { WalletService } from "../service/Wallet";

// Local Interface for Authenticated Requests
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export class WalletController {
  /**
   * CREATE Wallet
   * Body: { balance?: number }
   * Logic: Creates a new wallet. Defaults to 0 if no balance provided.
   */
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      // Default to 0 if user doesn't send a balance
      const initialBalance = req.body.balance ? Number(req.body.balance) : 0;
      
      if (isNaN(initialBalance)) return res.status(400).json({ error: "Invalid balance amount" });

      const wallet = await WalletService.createWallet(req.user.id, initialBalance);
      res.status(201).json(wallet);
    } catch (err: any) {
      // Handle "Wallet already exists" specifically
      if (err.message.includes("exists")) {
        return res.status(409).json({ error: err.message });
      }
      res.status(500).json({ error: err.message || "Failed to create wallet" });
    }
  }

  /**
   * GET Wallet
   * Logic: Returns wallet. Auto-creates one if missing (Self-healing).
   */
  static async get(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const wallet = await WalletService.getWallet(req.user.id);
      res.json(wallet);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch wallet" });
    }
  }

  /**
   * SET Balance (Hard Reset)
   * Method: PUT
   * Body: { balance: number }
   * Logic: "My wallet has exactly $500 now." (Overwrites old value)
   */
  static async setBalance(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const newBalance = Number(req.body.balance);
      if (isNaN(newBalance)) return res.status(400).json({ error: "Invalid balance amount" });

      const wallet = await WalletService.setBalance(req.user.id, newBalance);
      res.json(wallet);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update balance" });
    }
  }

  /**
   * TOP UP / SPEND (Adjust Balance)
   * Method: PATCH
   * Body: { amount: number }
   * Logic: "Add $50" (amount: 50) or "Subtract $20" (amount: -20)
   */
  static async adjustBalance(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const amountToChange = Number(req.body.amount);
      if (isNaN(amountToChange)) return res.status(400).json({ error: "Invalid amount" });

      const wallet = await WalletService.adjustBalance(req.user.id, amountToChange);
      res.json(wallet);
    } catch (err: any) {
      if (err.message === "Insufficient funds") {
        return res.status(400).json({ error: "Insufficient funds" });
      }
      res.status(500).json({ error: err.message || "Failed to adjust balance" });
    }
  }

  /**
   * DELETE Wallet
   */
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      await WalletService.deleteWallet(req.user.id);
      res.json({ message: "Wallet deleted successfully" });
    } catch (err: any) {
      if (err.message === "Wallet not found") {
        return res.status(404).json({ error: "Wallet not found" });
      }
      res.status(500).json({ error: err.message || "Something went wrong" });
    }
  }
}