import { UserController } from "../controller/UserController"
import { Router } from 'express'
import { upload } from "../middleware/upload"

const router = Router()

router.post('/:id/avatar',upload.single("avatars"), UserController.createAvatar)
router.post('/register', UserController.register)
router.post('/login', UserController.login)
router.get('/:id/profile', UserController.getMe)


// 1. Redirects user to Google Login page
router.get("/google", UserController.googleAuth);

// 2. Google redirects back here with a code
router.get("/google/callback", UserController.googleCallback);


router.put('/:id', UserController.updateUsername)

export default router
