import Transaction, { CategoryType, ITransaction } from "../models/Transaction";
import Wallet from "../models/Wallet"; 
import moment from "moment-timezone";
import mongoose from "mongoose"; // Import mongoose for sessions

// Interface for the filters coming from the Controller/URL
export interface TransactionFilters {
  category?: CategoryType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export class TransactionService {
  
  /**
   * CREATE: Transaction = Expense
   * Logic: Check Balance -> Subtract Money -> Save Transaction
   */
  static async create(
    userId: string,
    data: Partial<ITransaction>,
  ): Promise<ITransaction> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const spendAmount = Number(data.amount);

      // 1. Subtract from Wallet (Must have enough balance)
      const wallet = await Wallet.findOneAndUpdate(
        { user: userId, balance: { $gte: spendAmount } }, // Condition: Balance >= Amount
        { $inc: { balance: -spendAmount } },              // Action: Subtract
        { new: true, session }
      );

      if (!wallet) {
        throw new Error("Insufficient funds or Wallet not found");
      }

      // 2. Create Transaction
      const transaction = await Transaction.create([{
        ...data,
        user: userId,
      }], { session });

      await session.commitTransaction();
      return transaction[0]; // .create with session returns an array

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * DELETE: Undo Expense
   * Logic: Refund the money back to the wallet
   */
  static async deleteOne(
    userId: string,
    transactionId: string,
  ): Promise<ITransaction | null> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find the transaction first to know the amount
      const transaction = await Transaction.findOne({ _id: transactionId, user: userId }).session(session);
      if (!transaction) throw new Error("Transaction not found");

      // 2. Refund the Wallet (Add money back)
      await Wallet.findOneAndUpdate(
        { user: userId },
        { $inc: { balance: transaction.amount } },
        { session }
      );

      // 3. Delete the transaction
      await Transaction.deleteOne({ _id: transactionId }).session(session);

      await session.commitTransaction();
      return transaction;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * UPDATE: Adjust Expense
   * Logic: If amount changes, adjust wallet by the difference
   */
  static async updateOne(
    userId: string,
    transactionId: string,
    data: Partial<ITransaction>,
  ) {
    const allowedUpdates = ["amount", "category", "description", "date"];
    const inputKeys = Object.keys(data);
    const invalidFields = inputKeys.filter((key) => !allowedUpdates.includes(key));
    if (invalidFields.length > 0) throw new Error(`Invalid update: ${invalidFields.join(", ")}`);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Get original transaction
      const oldTransaction = await Transaction.findOne({ _id: transactionId, user: userId }).session(session);
      if (!oldTransaction) throw new Error("Transaction not found");

      // 2. If Amount is changing, handle Wallet Logic
      if (data.amount !== undefined && data.amount !== oldTransaction.amount) {
        const newAmount = Number(data.amount);
        const difference = newAmount - oldTransaction.amount; 
        
        // logic: 
        // Old = 10, New = 15. Diff = 5. We need to subtract 5 more from wallet.
        // Old = 10, New = 5. Diff = -5. We need to add 5 back to wallet.
        
        // So we subtract the DIFFERENCE from the wallet
        const wallet = await Wallet.findOneAndUpdate(
          { user: userId },
          { $inc: { balance: -difference } }, 
          { new: true, session }
        );

        if (!wallet || wallet.balance < 0) {
           throw new Error("Insufficient funds to update this transaction amount");
        }
      }

      // 3. Update Transaction
      const updatedTransaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, user: userId },
        data,
        { new: true, runValidators: true, session }
      );

      await session.commitTransaction();
      return updatedTransaction;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * GET ALL (Standard CRUD - No Wallet changes needed)
   */
  static async getAll(userId: string, filters?: TransactionFilters) {
    const query: any = { user: userId };
    if (filters?.category) query.category = filters.category;

    const options: any = {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
      sort: filters?.sortBy ? { [filters.sortBy]: filters.sortOrder === "asc" ? 1 : -1 } : { date: -1 }
    };

    return await (Transaction as any).paginate(query, options);
  }

  static async getOne(userId: string, transactionId: string): Promise<ITransaction> {
    const transaction = await Transaction.findOne({ user: userId, _id: transactionId });
    if (!transaction) throw new Error("Transaction not found");
    return transaction;
  }

  /**
   * DAILY STATS (Total = Total Spent)
   */
  static async getDailyTransactions(userId: string, date?: Date) {
    try {
      const targetDate = date ? moment(date).tz("Asia/Phnom_Penh") : moment().tz("Asia/Phnom_Penh");
      const startOfDay = targetDate.clone().startOf("day").toDate();
      const endOfDay = targetDate.clone().endOf("day").toDate();

      const transactions = await Transaction.find({
        user: userId,
        date: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ date: -1 }).lean();

      // Since all transactions are expenses, this is Total Spent
      const totalSpent = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      return {
        totalSpent, // Renamed for clarity, though frontend might expect 'total'
        date: targetDate.format("YYYY-MM-DD"),
        count: transactions.length,
        transactions,
      };
    } catch (err: any) {
      throw new Error(`Daily query failed: ${err.message}`);
    }
  }

  /**
   * MONTHLY STATS (Total = Total Spent)
   */
  static async getMonthlyTransactions(userId: string, month?: number, year?: number) {
    try {
      const now = moment().tz("Asia/Phnom_Penh");
      const m = month && month >= 1 && month <= 12 ? month : now.month() + 1;
      const y = year || now.year();

      const startOfMonth = moment.tz(`${y}-${m.toString().padStart(2, "0")}-01`, "YYYY-MM-DD", "Asia/Phnom_Penh").startOf("month");
      const startJS = startOfMonth.toDate();
      const endJS = startOfMonth.clone().endOf("month").toDate();

      const transactions = await Transaction.find({
        user: userId,
        date: { $gte: startJS, $lte: endJS },
      }).sort({ date: -1 }).lean();

      // Since all transactions are expenses, this is Total Spent
      const totalSpent = transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      return {
        totalSpent,
        month: startOfMonth.format("MMMM"),
        year: y,
        count: transactions.length,
        transactions,
      };
    } catch (e: any) {
      throw new Error("Monthly query failed: " + e.message);
    }
  }
}