import { eventEmitter } from "../utils/events.js";

eventEmitter.on("invitation_created", async (invitation) => {
    await sendPushNotification(invitation);
});