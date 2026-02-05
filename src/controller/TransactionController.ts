import { Request, Response } from "express";
import {
  TransactionService,
  TransactionFilters,
} from "../service/TransactionService";
import { CategoryType } from "../models/Transaction";
import { AuthRequest } from "../middleware/AuthMiddleware";
import moment from "moment-timezone";

export class TransactionController {
  static async createTransaction(req: AuthRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ error: "User not authenticated" });
    try {
      const newTransaction = await TransactionService.create(
        req.user.id,
        req.body,
      );
      res.status(201).json(newTransaction);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getAllTransactions(req: AuthRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ error: "User not authenticated" });

    try {
      // Extract query params
      const { category, page, limit, sortBy, sortOrder } = req.query;

      // Build filters object
      const filters: TransactionFilters = {
        page: page && !isNaN(Number(page)) ? Number(page) : 1,
        limit: limit && !isNaN(Number(limit)) ? Number(limit) : 10,
      };

      // Add category filter if valid
      if (
        category &&
        Object.values(CategoryType).includes(category as CategoryType)
      ) {
        filters.category = category as CategoryType;
      }

      // Add dynamic sort if provided
      if (sortBy && typeof sortBy === "string") {
        filters.sortBy = sortBy;
        filters.sortOrder = sortOrder === "asc" ? "asc" : "desc"; // default desc
      }

      // Fetch transactions from the service
      const transactions = await TransactionService.getAll(
        req.user.id,
        filters,
      );

      // Return paginated transactions
      res.status(200).json(transactions);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async getOneTransaction(req: AuthRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ error: "User not authenticated" });
    try {
      const transaction = await TransactionService.getOne(
        req.user.id,
        req.params.id as string,
      );
      res.status(200).json(transaction);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async deleteOneTransaction(req: AuthRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ error: "User not authenticated" });

    try {
      const transaction = await TransactionService.deleteOne(
        req.user.id,
        req.params.id as string,
      );
      res.status(204).send(transaction);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  // update transaction
  static async updateOneTransaction(req: AuthRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ error: "User not authenticated" });
    try {
      const transaction = await TransactionService.updateOne(
        req.user.id,
        req.params.id as string,
        req.body,
      );
      res.status(200).json(transaction);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  static async getDailyTransactions(req: AuthRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ error: "User not authenticated" });

    try {
      // 1. Call service to get daily transactions
      const data = await TransactionService.getDailyTransactions(req.user.id);

      // 2. Format response
      const transactions = data.transactions.map((t) => ({
        id: t._id,
        category: t.category,
        amount: t.amount,
        description: t.description,
        date: moment(t.createdAt)
          .tz("Asia/PhnomPenh") 
          .format("YYYY-MM-DD"),
      }));

      res.status(200).json({
        message: "Daily transactions fetched successfully",
        data: {
          total: data.total,
          date: data.date,
          transactions,
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Something went wrong" });
    }
  }

  static async getMonthlyTransactions(req: AuthRequest, res: Response) {
    // 1. Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      // 2. Extract query params (1-indexed month)
      const monthParam = req.query.month
        ? parseInt(req.query.month as string)
        : undefined;
      const yearParam = req.query.year
        ? parseInt(req.query.year as string)
        : undefined;

      // 3. Call service
      const data = await TransactionService.getMonthlyTransactions(
        req.user.id,
        monthParam,
        yearParam,
      );

      // 4. Format response
      const transactions = data.transactions.map((t) => ({
        id: t._id,
        category: t.category,
        amount: t.amount,
        description: t.description,
        date: moment(t.createdAt)
          .tz("Asia/PhnomPenh") // convert to UTC+7
          .format("YYYY-MM-DD"),
      }));

      res.status(200).json({
        message: "Monthly transactions fetched successfully",
        data: {
          total: data.total,
          month: data.month,
          year: data.year,
          transactions,
        },
      });
    } catch (err: any) {
      res.status(400).json({
        error: err.message || "Something went wrong fetching transactions",
      });
    }
  }
}
