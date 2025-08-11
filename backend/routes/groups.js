import express from "express";
import { groupController } from "../controllers/index.js"
import { authMiddleware } from "../middleware/auth.js";

const groupRouter = express.Router();

export default groupRouter;