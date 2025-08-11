import express from "express"
import { invitationLogger } from "../utils/logger.js";
import { eventEmitter } from "../utils/events.js";


const invitationService = async () => {

    const invitation = await createInvitation();
    eventEmitter.emit('invitation_created', invitation);

}

export default invitationService;