import express from "express";
import { userController } from "../controllers/index.js";
import { authMiddleware, requireUserOwnership, requireInvitationParticipant } from "../middleware/auth.js";

const userRouter = express.Router();
userRouter.use(authMiddleware);

userRouter.get("/:id", requireUserOwnership, userController.getUser);
userRouter.get("/:id/groups", requireUserOwnership, userController.getGroups);
userRouter.get("/:id/list", requireUserOwnership, userController.getList);
userRouter.get("/:id/invitations/received", requireInvitationParticipant, userController.getReceived);
userRouter.get("/:id/invitations/sent", requireInvitationParticipant, userController.getSent);
userRouter.post("/:id/list/items", requireUserOwnership, userController.addItem);
userRouter.put("/:id", requireUserOwnership, userController.updateUser);
userRouter.put("/:id/list/clear", requireUserOwnership, userController.clearList);
userRouter.delete("/:id", requireUserOwnership, userController.deleteUser);

export default userRouter;