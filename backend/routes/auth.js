import express from "express";
import { authController } from "../controllers/index.js"
import { authMiddleware } from "../middleware/auth.js"

const authRouter = express.Router();

authRouter.get("/me", authMiddleware, authController.me);
authRouter.post("/signup", authController.signup);
authRouter.post("/signin", authController.signin);
authRouter.post("/signout", authMiddleware, authController.signout);
authRouter.post("/refresh", authMiddleware, authController.refresh);

export default authRouter;

