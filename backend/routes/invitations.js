import express from "express";
import { invitationController } from "../controllers/index.js"
import { authMiddleware, requireInvitationParticipant, requireGroupMember } from "../middleware/auth.js";

const invitationRouter = express.Router();

//invitationRouter.post("/cleanup", invitationController.clearExpired); // system
//invitationRouter.post("/:id/notify", invitationController.notifyUser); // system

invitationRouter.use(authMiddleware);

invitationRouter.get("/:id", requireInvitationParticipant, invitationController.getDetails);
invitationRouter.post("/group-invite", requireGroupMember, invitationController.sendInvite);
invitationRouter.post("/join-request", invitationController.sendRequest);
invitationRouter.post("/start-group", invitationController.startGroup);
invitationRouter.put("/:id/accept", requireInvitationParticipant, invitationController.acceptInvite);
invitationRouter.put("/:id/decline", requireInvitationParticipant, invitationController.declineInvite);
invitationRouter.delete("/:id", requireInvitationParticipant, invitationController.cancelInvite);

export default invitationRouter;