import { TransactionController } from "../controller/TransactionController";
import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

const router = Router()

router.post('/', AuthMiddleware, TransactionController.createTransaction)
router.get('/', AuthMiddleware, TransactionController.getAllTransactions)
router.get('/monthly', AuthMiddleware, TransactionController.getMonthlyTransactions)
router.get('/daily', AuthMiddleware, TransactionController.getDailyTransactions)
router.get('/:id', AuthMiddleware, TransactionController.getOneTransaction)
router.delete('/:id', AuthMiddleware, TransactionController.deleteOneTransaction)
router.put('/:id', AuthMiddleware, TransactionController.updateOneTransaction)


export default router