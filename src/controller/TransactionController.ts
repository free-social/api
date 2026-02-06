import { Request, Response } from "express";
import {
  TransactionService,
  TransactionFilters,
} from "../service/TransactionService";
import { CategoryType } from "../models/Transaction";
import { AuthRequest } from "../middleware/AuthMiddleware"; // Assuming this is your interface location
import moment from "moment-timezone";

export class TransactionController {
  
  /**
   * CREATE: Automatically subtracts from Wallet
   */
  static async createTransaction(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: "User not authenticated" });
    
    try {
      // Service now returns the created transaction AND the new wallet balance
      // You might need to adjust the service return type if you haven't already
      const result = await TransactionService.create(req.user.id, req.body);
      
      // If your service returns just the transaction (as per your last valid service code):
      res.status(201).json(result); 

    } catch (err: any) {
      if (err.message.includes("Insufficient")) {
        return res.status(400).json({ error: err.message });
      }
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * GET ALL: With Filters & Pagination
   */
  static async getAllTransactions(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: "User not authenticated" });

    try {
      const { category, page, limit, sortBy, sortOrder } = req.query;

      const filters: TransactionFilters = {
        page: page && !isNaN(Number(page)) ? Number(page) : 1,
        limit: limit && !isNaN(Number(limit)) ? Number(limit) : 10,
      };

      if (category && Object.values(CategoryType).includes(category as CategoryType)) {
        filters.category = category as CategoryType;
      }

      if (sortBy && typeof sortBy === "string") {
        filters.sortBy = sortBy;
        filters.sortOrder = sortOrder === "asc" ? "asc" : "desc";
      }

      const transactions = await TransactionService.getAll(req.user.id, filters);
      res.status(200).json(transactions);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getOneTransaction(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: "User not authenticated" });
    try {
      const transaction = await TransactionService.getOne(req.user.id, req.params.id as string);
      res.status(200).json(transaction);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * DELETE: Refunds the wallet automatically
   */
  static async deleteOneTransaction(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: "User not authenticated" });

    try {
      const transaction = await TransactionService.deleteOne(req.user.id, req.params.id as string);
      // 200 OK because we return the deleted object (useful for undo in UI)
      res.status(200).json({ message: "Transaction deleted and refunded", data: transaction });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * UPDATE: Adjusts wallet if amount changed
   */
  static async updateOneTransaction(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: "User not authenticated" });
    try {
      const transaction = await TransactionService.updateOne(
        req.user.id,
        req.params.id as string,
        req.body,
      );
      res.status(200).json(transaction);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getDailyTransactions(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: "User not authenticated" });

    try {
      // Service call
      const data = await TransactionService.getDailyTransactions(req.user.id);

      // Formatting
      const transactions = data.transactions.map((t: any) => ({
        id: t._id,
        category: t.category,
        amount: t.amount,
        description: t.description,
        // FIX: Use 'date' (the transaction date), not 'createdAt' (the db insertion time)
        date: moment(t.date).tz("Asia/Phnom_Penh").format("YYYY-MM-DD"),
      }));

      res.status(200).json({
        message: "Daily transactions fetched successfully",
        data: {
          totalSpent: data.totalSpent, // Renamed to match Service
          date: data.date,
          transactions,
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Something went wrong" });
    }
  }

  static async getMonthlyTransactions(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: "User not authenticated" });

    try {
      const monthParam = req.query.month ? parseInt(req.query.month as string) : undefined;
      const yearParam = req.query.year ? parseInt(req.query.year as string) : undefined;

      const data = await TransactionService.getMonthlyTransactions(
        req.user.id,
        monthParam,
        yearParam,
      );

      const transactions = data.transactions.map((t: any) => ({
        id: t._id,
        category: t.category,
        amount: t.amount,
        description: t.description,
        // FIX: Use 'date' here as well
        date: moment(t.date).tz("Asia/Phnom_Penh").format("YYYY-MM-DD"),
      }));

      res.status(200).json({
        message: "Monthly transactions fetched successfully",
        data: {
          totalSpent: data.totalSpent,
          month: data.month,
          year: data.year,
          transactions,
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Something went wrong" });
    }
  }
}