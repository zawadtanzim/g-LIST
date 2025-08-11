import express from "express";
import { itemController } from "../controllers/index.js"
import { authMiddleware } from "../middleware/auth.js";

const itemRouter = express.Router();



export default itemRouter;