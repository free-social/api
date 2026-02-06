import { Router } from "express";
import { WalletController } from "../controller/WalletController";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

const router = Router();

/**
 * BASE ROUTE: /api/wallet (Assumed)
 */

// 1. CREATE: Initialize a wallet for a new user
// POST /api/wallet
router.post('/', AuthMiddleware, WalletController.create);

// 2. READ: Get the current wallet balance
// GET /api/wallet
router.get('/', AuthMiddleware, WalletController.get);

// 3. SET BALANCE: Hard reset the balance (Admin/Manual Edit)
// PUT /api/wallet
// Body: { "balance": 500 }
// Note: Changed from '/balance' to '/' because standard REST PUT usually updates the resource itself.
router.put('/', AuthMiddleware, WalletController.setBalance);

// 4. ADJUST BALANCE: Add or Subtract money (Transactions)
// PATCH /api/wallet/adjust
// Body: { "amount": 50 }  or { "amount": -20 }
router.patch('/adjust', AuthMiddleware, WalletController.adjustBalance);

// 5. DELETE: Remove the wallet
// DELETE /api/wallet
router.delete('/', AuthMiddleware, WalletController.delete);

export default router;