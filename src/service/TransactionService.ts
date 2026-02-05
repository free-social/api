import Transaction, { CategoryType, ITransaction } from "../models/Transaction";
import moment from "moment-timezone";
import { Types } from "mongoose";

// Interface for the filters coming from the Controller/URL
export interface TransactionFilters {
  category?: CategoryType;
  page?: number;
  limit?: number;
  sortBy?: string; // field to sort by 'amount' or 'createdAt'
  sortOrder?: "asc" | "desc";
}

export class TransactionService {
  /**
   * Create a new transaction
   * We need the userId so we know who owns this data.
   */
  static async create(
    userId: string,
    data: Partial<ITransaction>,
  ): Promise<ITransaction> {
    const transaction = await Transaction.create({
      ...data,
      user: userId, // Link it to the user!
    });
    return transaction.save();
  }

  /**
   * Get all transactions
   * Now supports filtering by Category and sort, pagination
   */
  static async getAll(userId: string, filters?: TransactionFilters) {
    const query: any = { user: userId };

    // Category filter
    if (filters?.category) {
      query.category = filters.category;
    }

    // Pagination options
    const options: any = {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
    };

    // Dynamic sorting for all data
    if (filters?.sortBy) {
      const order = filters.sortOrder === "asc" ? 1 : -1;
      options.sort = { [filters.sortBy]: order };
    }

    const result = await (Transaction as any).paginate(query, options);
    return result;
  }

  static async getOne(
    userId: string,
    transactionId: string,
  ): Promise<ITransaction> {
    const transaction = await Transaction.findOne({
      user: userId,
      _id: transactionId,
    });
    if (!transaction) throw new Error("Transaction not found");
    return transaction;
  }

  // Delete transaction
  static async deleteOne(
    userId: string,
    transactionId: string,
  ): Promise<ITransaction> {
    const transaction = await Transaction.findOneAndDelete({
      user: userId,
      _id: transactionId,
    });
    if (!transaction) throw new Error("Transaction not found");
    return transaction;
  }

  // Update transaction
  static async updateOne(
    userId: string,
    transactionId: string,
    data: Partial<ITransaction>,
  ) {
    // 1. Define strictly what is allowed (Added 'date' as it's often editable)
    const allowedUpdates = ["amount", "category", "description", "date"];

    // 2. Get the keys actually sent by the user
    const inputKeys = Object.keys(data);

    // 3. Find any keys that are NOT in the allowed list
    const invalidFields = inputKeys.filter(
      (key) => !allowedUpdates.includes(key),
    );

    // 4. If we found any invalid fields, STOP and throw an error
    if (invalidFields.length > 0) {
      throw new Error(
        `Invalid update! You are not allowed to update: ${invalidFields.join(
          ", ",
        )}`,
      );
    }

    // 5. Proceed safely - we now know 'data' only contains valid fields
    const transaction = await Transaction.findOneAndUpdate(
      { user: userId, _id: transactionId },
      data,
      { new: true, runValidators: true },
    );

    if (!transaction) throw new Error("Transaction not found");
    return transaction;
  }

  static async getDailyTransactions(userId: string, date?: Date) {
    try {
      // 1. Establish the target date in the specific timezone
      // If 'date' is provided, we treat it as that day in Asia/Phnom_Penh.
      // If not, we take the current moment in Asia/Phnom_Penh.
      const targetDate = date
        ? moment(date).tz("Asia/Phnom_Penh")
        : moment().tz("Asia/Phnom_Penh");

      // 2. Define the exact boundaries (00:00:00 to 23:59:59)
      // We use .toDate() which Mongoose will correctly translate back to UTC for the DB query.
      const startOfDay = targetDate.clone().startOf("day").toDate();
      const endOfDay = targetDate.clone().endOf("day").toDate();

      // 3. Query using the 'date' field
      // .lean() is added to improve performance for read-only operations
      const transactions = await Transaction.find({
        user: userId,
        date: { $gte: startOfDay, $lte: endOfDay },
      })
        .sort({ date: -1 })
        .lean();

      // 4. Calculate total (ensuring amount is treated as a number)
      const total = transactions.reduce(
        (sum, t) => sum + (Number(t.amount) || 0),
        0,
      );

      return {
        total,
        date: targetDate.format("YYYY-MM-DD"),
        count: transactions.length,
        transactions,
      };
    } catch (err: any) {
      throw new Error(
        `Something went wrong in getDailyTransactions: ${err.message}`,
      );
    }
  }

  static async getMonthlyTransactions(
    userId: string,
    month?: number,
    year?: number,
  ) {
    try {
      const now = moment().tz("Asia/Phnom_Penh");
      const m = month && month >= 1 && month <= 12 ? month : now.month() + 1;
      const y = year || now.year();

      // Force the start of the month to 00:00:00.000 in Cambodia time
      const startOfMonth = moment
        .tz(
          `${y}-${m.toString().padStart(2, "0")}-01`,
          "YYYY-MM-DD",
          "Asia/Phnom_Penh",
        )
        .startOf("month");

      // Create the exact range
      const startJS = startOfMonth.toDate();
      const endJS = startOfMonth.clone().endOf("month").toDate();

      const transactions = await Transaction.find({
        user: userId,
        date: {
          $gte: startJS,
          $lte: endJS,
        },
      })
        .sort({ date: -1 })
        .lean();

      const total = transactions.reduce(
        (sum, t) => sum + (Number(t.amount) || 0),
        0,
      );

      return {
        total,
        month: startOfMonth.format("MMMM"),
        year: y,
        count: transactions.length, // Useful for debugging
        transactions,
      };
    } catch (e: any) {
      throw new Error("Monthly query failed: " + e.message);
    }
  }


}
