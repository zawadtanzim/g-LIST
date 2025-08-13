import express from "express";
import { itemController } from "../controllers/index.js"
import { authMiddleware, requireItemAccess } from "../middleware/auth.js";

const itemRouter = express.Router();

itemRouter.use(authMiddleware);

itemRouter.get("/:id", requireItemAccess,itemController.getItem);
itemRouter.put("/:id",  requireItemAccess, itemController.updateDetails);
itemRouter.put("/:id/status", requireItemAccess, itemController.updateStatus);
itemRouter.delete("/:id", requireItemAccess, itemController.deleteItem);

export default itemRouter;