import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
import { Types } from "mongoose";

export class WalletService {
  /**
   * Create wallet for the user
   */
  static async createWallet(userId: string, amount: number) {
    const wallet = await Wallet.create({ user: userId, amount });
    return wallet;
  }

  /**
   * Get wallet summary
   * Calculates total spent from transactions and remaining
   * If wallet does not exist, input and remaining default to 0
   */
  // static async getWallet(userId: string) {
  //   // Find wallet (optional)
  //   const wallet = await Wallet.findOne({ user: userId });

  //   // Sum all transaction amounts for this user
  //   const totalSpentAgg = await Transaction.aggregate([
  //     { $match: { user: new Types.ObjectId(userId) } },
  //     { $group: { _id: null, total: { $sum: "$amount" } } },
  //   ]);
  //   const totalSpent = totalSpentAgg[0]?.total || 0;

  //   return {
  //     input: wallet?.amount || 0,                         
  //     spent: totalSpent,                                
  //     remaining: (wallet?.amount || 0) - totalSpent,     
  //   };
  // }

  static async getWallet(userId: string) {
    const wallet = await Wallet.findOne({ user: userId });
    return wallet;
  }


  /**
   * Update wallet amount
   * If wallet does not exist, creates it
   */
  static async updateWallet(userId: string, amount: number) {
    const wallet = await Wallet.findOneAndUpdate(
      { user: userId },
      { amount },
      { new: true, upsert: true } // create if not exists
    );
    return wallet;
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
