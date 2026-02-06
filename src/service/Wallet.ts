import Wallet from "../models/Wallet";
import { Types } from "mongoose";

export class WalletService {
  /**
   * Create a new wallet with an initial balance
   */
  static async createWallet(userId: string, initialBalance: number = 0) {
    // Check if wallet already exists to prevent duplicates
    const existing = await Wallet.findOne({ user: userId });
    if (existing) throw new Error("Wallet already exists for this user");

    const wallet = await Wallet.create({ 
      user: userId, 
      balance: initialBalance 
    });
    return wallet;
  }

  /**
   * Get wallet details. 
   * Optional: Auto-create if it doesn't exist (Self-healing)
   */
  static async getWallet(userId: string) {
    let wallet = await Wallet.findOne({ user: userId });
    
    // Safety Net: If a user has no wallet, create one automatically
    if (!wallet) {
      wallet = await Wallet.create({ user: userId, balance: 0 });
    }
    
    return wallet;
  }

  /**
   * ⚠️ SET Balance (Hard Reset)
   * Use this ONLY for admin tools or manual corrections.
   * Do NOT use this for transactions (it causes race conditions).
   */
  static async setBalance(userId: string, newBalance: number) {
    const wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      { balance: newBalance }, // Completely replaces the old value
      { new: true, upsert: true }
    );
    return wallet;
  }

  /**
   * ✅ ADJUST Balance (Safe for Transactions)
   * Use this for Expenses (-amount) and Income (+amount).
   * Uses $inc to safely handle concurrent requests.
   */
  static async adjustBalance(userId: string, amountToChange: number) {
    // 1. Check for valid Wallet first
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) throw new Error("Wallet not found");

    // 2. Prevent negative balance (Optional specific check)
    if (wallet.balance + amountToChange < 0) {
       throw new Error("Insufficient funds");
    }

    // 3. Atomic Update
    const updatedWallet = await Wallet.findOneAndUpdate(
      { user: userId },
      { $inc: { balance: amountToChange } }, // Adds or Subtracts atomically
      { new: true }
    );

    return updatedWallet;
  }

  /**
   * Delete wallet
   */
  static async deleteWallet(userId: string) {
    const wallet = await Wallet.findOneAndDelete({ user: userId });
    if (!wallet) throw new Error("Wallet not found");
    return wallet;
  }
}