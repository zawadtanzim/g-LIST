import express from "express";
import { userController } from "../controllers/index.js";
import { authMiddleware } from "../middleware/auth.js";

const userRouter = express.Router();


export default userRouter;