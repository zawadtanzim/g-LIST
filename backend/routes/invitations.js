import express from "express";
import { invitationController } from "../controllers/index.js"
import { authMiddleware } from "../middleware/auth.js";

const invitationRouter = express.Router();

invitationRouter.post("/cleanup", invitationController.clearExpired); // system
invitationRouter.post("/:id/notify", invitationController.notifyUser); // system

invitationRouter.use(authMiddleware);

invitationRouter.get("/:id", invitationController.getDetails);
invitationRouter.post("/group-invite", invitationController.sendInvite);
invitationRouter.post("/join-request", invitationController.sendRequest);
invitationRouter.post("/start-group", invitationController.startGroup);
invitationRouter.put("/:id/accept", invitationController.acceptInvite);
invitationRouter.put("/:id/decline", invitationController.declineInvite);
invitationRouter.delete("/:id", invitationController.cancelInvite);

export default invitationRouter;