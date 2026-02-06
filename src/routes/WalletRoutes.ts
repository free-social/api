import { WalletController } from "../controller/WalletController";
import { Router } from "express";
import { AuthMiddleware } from "../middleware/AuthMiddleware";

const router = Router()

router.post('/', AuthMiddleware, WalletController.create)
router.get('/:id', AuthMiddleware, WalletController.get)
router.put('/:id', AuthMiddleware, WalletController.update)
router.delete('/', AuthMiddleware, WalletController.delete)


export default router