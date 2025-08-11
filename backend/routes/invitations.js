import express from "express";
import { invitationController } from "../controllers/index.js"
import { authMiddleware } from "../middleware/auth.js";

const invitationRouter = express.Router();

export default invitationRouter;