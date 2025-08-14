import { invitationLogger } from "../utils/logger.js";
import { eventEmitter } from "../utils/events.js";
import { generateCode } from "../utils/codeGenerator.js";


const invitationService = {
    getDetails: async (invitationID) => {
        if (!invitationID) {
            invitationLogger.warn("getDetails called without invitationID");
            const err = new Error("Invitation ID is required");
            err.status = 400;
            throw err;
        }

        try {
            const existingInvite = await prisma.invitations.findUnique({
                where: {
                    id: invitationID
                },
                select: {
                    id: true,
                    type: true,
                    status: true,
                    message: true,
                    from_user_id: true,
                    to_user_id: true,
                    group_id: true,
                    created_at: true,
                    expires_at: true,
                    responded_at: true,
                    FromUser: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            profile_pic: true,
                            user_code: true
                        }
                    },
                    ToUser: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            profile_pic: true,
                            user_code: true
                        }
                    },
                    Group: {
                        select: {
                            id: true,
                            group_name: true,
                            group_code: true,
                            group_image: true,
                            created_at: true
                        }
                    }
                }
            });

            if(!existingInvite){
                invitationLogger.warn(`Invitation with id: ${invitationID} was not found`);
                const err = new Error("Invitation not found");
                err.status = 404;
                throw err;
            }

            invitationLogger.info(`Retrived invitation with id: ${existingInvite.id}`);
            return existingInvite;

        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            invitationLogger.error(`Database error in getDetails: ${error.message}`);
            throw new Error("Failed to retrieve user");
        }
    },

    sendInvite: async (fromUserID, inviteData) => {
        if (!fromUserID) {
            invitationLogger.warn("sendInvite called without fromUserID");
            const err = new Error("From User ID is required");
            err.status = 400;
            throw err;
        }

        const { to_user_code, from_group_id, message } = inviteData;

        if(!to_user_code || !from_group_id) {
            invitationLogger.warn("sendInvite called without to_user_code and from_group_id");
            const err = new Error("to_user_code and from_group_id are required");
            err.status = 400;
            throw err;
        }

        try {
            const sentInvite = await prisma.$transaction( async (trxn) => {
                const toUser = await trxn.users.findUnique({
                    where: {
                        user_code: to_user_code
                    }
                });

                if (!toUser) {
                    const err = new Error("User with that code not found");
                    err.status = 404;
                    throw err;
                }

                if (fromUserID === toUser.id) {
                    const err = new Error("You cannot invite yourself");
                    err.status = 400;
                    throw err;
                }

                const existingMembership = await trxn.groupMembers.findUnique({
                    where: {
                        user_id_group_id: {
                            user_id: toUser.id,
                            group_id: from_group_id
                        }
                    }
                });

                if (existingMembership) {
                    const err = new Error("User is already a member of this group");
                    err.status = 409;
                    throw err;
                }

                const invite = await trxn.invitations.create({
                    data: {
                        from_user_id: fromUserID,
                        to_user_id: toUser.id,
                        group_id: from_group_id,
                        type: "GROUP_INVITE",
                        status: "PENDING",
                        message: message || null,
                    }
                });

                return invite
            });

            invitationLogger.info(`Sent invite to user ${to_user_code} for group ${from_group_id}`);
            eventEmitter.emit('invitation_received', sentInvite);
            return sentInvite;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            invitationLogger.error(`Database error in sendInvite: ${error.message}`);
            throw new Error("Failed to send join group invite");
        }
    },

    sendRequest: async (fromUserID, requestData) => {
        if (!fromUserID) {
            invitationLogger.warn("sendRequest called without fromUserID");
            const err = new Error("From User ID is required");
            err.status = 400;
            throw err;
        }

        const { to_group_code, message } = requestData;

        if(!to_group_code) {
            invitationLogger.warn("sendRequest called without to_group_code");
            const err = new Error("to_group_code is required");
            err.status = 400;
            throw err;
        }

        try {
            const sentRequests = await prisma.$transaction( async (trxn) => {
                const toGroup = await trxn.groups.findUnique({
                    where: {
                        group_code: to_group_code
                    },
                    include: {
                        GroupMembers: {
                            select: {
                                user_id: true
                            }
                        }
                    }
                });

                if (!toGroup) {
                    const err = new Error("Group with that code not found");
                    err.status = 404;
                    throw err;
                }   

                const existingMembership = toGroup.GroupMembers.find(
                    member => member.user_id === fromUserID
                );

                if (existingMembership) {
                    const err = new Error("User is already a member of this group");
                    err.status = 409;
                    throw err;
                }

                const existingRequest = await trxn.invitations.findFirst({
                    where: {
                        from_user_id: fromUserID,
                        group_id: toGroup.id,
                        type: "JOIN_REQUEST",
                        status: "PENDING"
                    }
                });

                if (existingRequest) {
                    const err = new Error("You already have a pending join request for this group");
                    err.status = 409;
                    throw err;
                }

                const memberUserIDs = toGroup.GroupMembers.map(member => member.user_id);

                const createdRequests = [];

                for(const memberUserID of memberUserIDs) {
                    const request = await trxn.invitations.create({
                        data: {
                            from_user_id: fromUserID,
                            to_user_id: memberUserID,
                            group_id: toGroup.id,
                            type: "JOIN_REQUEST",
                            status: "PENDING",
                            message: message || null,
                        }
                    });

                    createdRequests.push(request);
                }

                return {
                    invitations: createdRequests,
                    group_name: toGroup.group_name,
                    group_id: toGroup.id
                };
            });

            invitationLogger.info(`Sent join request to group ${to_group_code} (${sentRequests.invitations.length} invitations created)`);
            eventEmitter.emit('invitation_received', sentRequests.invitations[0]);
            return {
                data: {
                    id: sentRequests.invitations[0]?.id,
                    type: "JOIN_REQUEST",
                    status: "PENDING",
                    message: message || null,
                    from_user_id: fromUserID,
                    to_group_id: sentRequests.group_id,
                    created_at: sentRequests.invitations[0]?.created_at,
                    expires_at: sentRequests.invitations[0]?.expires_at,
                    responded_at: null
                }
            };
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            invitationLogger.error(`Database error in sendRequest: ${error.message}`);
            throw new Error("Failed to send request to join group invite");
        }
    },

    startGroup: async (fromUserID, groupData) => {
        if (!fromUserID) {
            invitationLogger.warn("startGroup called without fromUserID");
            const err = new Error("From User ID is required");
            err.status = 400;
            throw err;
        }

        const { to_user_code, group_name, message } = groupData;
        
        if(!to_user_code || !group_name) {
            invitationLogger.warn("startGroup called without to_user_code or group_name");
            const err = new Error("to_user_code and group_name are required");
            err.status = 400;
            throw err;
        }

        try {
            const startGroup = await prisma.$transaction(async (trxn) => {
                const toUser = await trxn.users.findUnique({
                    where: {
                        user_code: to_user_code
                    }
                });

                if (!toUser) {
                    const err = new Error("User with that code not found");
                    err.status = 404;
                    throw err;
                }

                if (fromUserID === toUser.id) {
                    const err = new Error("You cannot invite yourself");
                    err.status = 400;
                    throw err;
                }

                const existingRequest = await trxn.invitations.findFirst({
                    where: {
                        from_user_id: fromUserID,
                        to_user_id: toUser.id,
                        type: "START_GROUP",
                        status: "PENDING"
                    }
                });

                if (existingRequest) {
                    const err = new Error("You already have a pending request to start a group with this user");
                    err.status = 409;
                    throw err;
                }

                const invite  = await trxn.invitations.create({
                    data: {
                        from_user_id: fromUserID,
                        to_user_id: toUser.id,
                        type: "START_GROUP",
                        status: "PENDING",
                        message: message || null,
                        group_name,

                    }
                });

                return invite;
            });

            invitationLogger.info(`Sent invite to user ${to_user_code} from user ${fromUserID}`);
            eventEmitter.emit('invitation_received', startGroup);
            return startGroup;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            invitationLogger.error(`Database error in startGroup: ${error.message}`);
            throw new Error("Failed to send start group invite");
        }
    },

    acceptInvite: async (userID, invitationID) => {
        if (!userID || !invitationID) {
            invitationLogger.warn("acceptInvite called without userID or invitationID");
            const err = new Error("User ID and Invitation ID are required");
            err.status = 400;
            throw err;
        }

        try {
            const result = await prisma.$transaction( async (trxn) => {
                const invitation = await trxn.invitations.findUnique({
                    where: {
                        id: invitationID
                    },
                    include: {
                        FromUser: {
                            select: {
                                first_name: true,
                                last_name: true,
                                user_code: true
                            }
                        },
                        ToUser: {
                            select: {
                                first_name: true,
                                last_name: true,
                                user_code: true
                            }
                        }
                    }
                });

                if (!invitation) {
                    const err = new Error("Invitation not found");
                    err.status = 404;
                    throw err;
                }

                if (invitation.status !== "PENDING") {
                    const err = new Error("This invitation has already been responded to");
                    err.status = 400;
                    throw err;
                }

                // Check if invitation has expired
                if (invitation.expires_at && new Date() > invitation.expires_at) {
                    const err = new Error("This invitation has expired");
                    err.status = 400;
                    throw err;
                }

                let newGroup = null;
                let newMembers = [];

                // create new group
                if(invitation.type === "START_GROUP") {
                    const group = await trxn.groups.create({
                        data: {
                            group_name: invitation.group_name,
                            group_code: generateCode("group")
                        }
                    });
                    
                    newGroup = group;

                    const newMemberIDs = [invitation.from_user_id, invitation.to_user_id];

                    for(const memberID of newMemberIDs) {
                        const member = await trxn.groupMembers.create({
                            data: {
                                user_id: memberID,
                                group_id: group.id
                            }
                        });
                        newMembers.push(member);
                    }
                    
                    const groupList = await trxn.lists.create({
                        data: {
                            expected_total: 0.00,
                            actual_total: 0.00
                        }
                    });
                    
                    await trxn.groupLists.create({
                        data: {
                            group_id: group.id,
                            list_id: groupList.id,
                        }
                    });
                }
                else if (invitation.type === "JOIN_REQUEST" || invitation.type === "GROUP_INVITE") {
                    if (!invitation.group_id) {
                        const err = new Error(`Invalid ${invitation.type.toLowerCase().replace('_', ' ')} - no group specified`);
                        err.status = 400;
                        throw err;
                    }
                    
                    const joiningUserId = invitation.type === "JOIN_REQUEST" 
                        ? invitation.from_user_id  // Person who sent the join request
                        : invitation.to_user_id;   // Person who was invited
                    
                    // Check if user is already a member
                    const existingMember = await trxn.groupMembers.findUnique({
                        where: {
                            user_id_group_id: {
                                user_id: joiningUserId,
                                group_id: invitation.group_id
                            }
                        }
                    });
                    
                    if (existingMember) {
                        const err = new Error("User is already a member of this group");
                        err.status = 409;
                        throw err;
                    }
                    
                    // Add user to existing group
                    const newMember = await trxn.groupMembers.create({
                        data: {
                            user_id: joiningUserId,
                            group_id: invitation.group_id
                        }
                    });
                    newMembers.push(newMember);
                    
                    if (invitation.type === "JOIN_REQUEST") {
                        await trxn.invitations.deleteMany({
                            where: {
                                from_user_id: invitation.from_user_id, 
                                group_id: invitation.group_id,          
                                type: "JOIN_REQUEST",                   
                                status: "PENDING"                      
                            },
                        });
                    }
                    else {
                        await trxn.invitations.delete({
                            where: { 
                                id: invitationID 
                            }
                        });
                    }

                    // Get group details for response
                    newGroup = await trxn.groups.findUnique({
                        where: { 
                            id: invitation.group_id 
                        }
                    });
                }
                
                // Store invitation data for event emission before deletion
                const invitationData = {
                    ...invitation,
                    status: 'ACCEPTED' // For event emission purposes
                };

                eventEmitter.emit('invitation_status_updated', {
                    invitation: result.invitationData,
                    status: 'ACCEPTED',
                    recipientData: result.invitationData.ToUser
                });

                return {
                    invitation: updatedInvitation,
                    group: newGroup,
                    newMembers: newMembers,
                    invitationData: invitation
                }
            });

            invitationLogger.info(`User ${userID} accepted invitation ${invitationID} of type ${result.invitationData.type}`);
            return {
                invitation: result.invitation,
                group: result.group,
                group_name: result.group_name,
                type: result.invitation.type
            }
        
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            invitationLogger.error(`Database error in acceptInvite: ${error.message}`);
            throw new Error("Failed to accept invitation");
        }
    },

    declineInvite: async (userID, invitationID) => {
        if (!userID || !invitationID) {
            invitationLogger.warn("declineInvite called without userID or invitationID");
            const err = new Error("User ID and Invitation ID are required");
            err.status = 400;
            throw err;
        }

        try {
            const result = await prisma.$transaction(async (trxn) => {
                const invitation = await trxn.invitations.findUnique({
                    where: {
                        id: invitationID
                    },
                    include: {
                        FromUser: {
                            select: {
                                first_name: true,
                                last_name: true,
                                user_code: true
                            }
                        },
                        ToUser: {
                            select: {
                                first_name: true,
                                last_name: true,
                                user_code: true
                            }
                        },
                        Group: {
                            select: {
                                group_name: true,
                                group_code: true
                            }
                        }
                    }
                });
                
                if (!invitation) {
                    const err = new Error("Invitation not found");
                    err.status = 404;
                    throw err;
                }
                
                if (invitation.status !== "PENDING") {
                    const err = new Error("This invitation has already been responded to");
                    err.status = 400;
                    throw err;
                }
                
                if (invitation.expires_at && new Date() > invitation.expires_at) {
                    const err = new Error("This invitation has expired");
                    err.status = 400;
                    throw err;
                }
                
                const updatedInvitation = await trxn.invitations.delete({
                    where: { id: invitationID }
                });
                
                return {
                    invitation: updatedInvitation,
                    invitationData: invitation
                };
            });

            invitationLogger.info(`User ${userID} declined invitation ${invitationID} of type ${result.invitationData.type}`);
            
            eventEmitter.emit('invitation_status_updated', {
                invitation: result.invitationData,
                status: 'DECLINED',
                recipientData: result.invitationData.ToUser
            });
            return {
                invitation: result.invitation,
                type: result.invitationData.type
            }
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            invitationLogger.error(`Database error in declineInvite: ${error.message}`);
            throw new Error("Failed to decline invitation");
        }
    },

    cancelInvite: async (userID, invitationID) => {
        if (!userID || !invitationID) {
            invitationLogger.warn("cancelInvite called without userID or invitationID");
            const err = new Error("User ID and Invitation ID are required");
            err.status = 400;
            throw err;
        }

        try {
            const result = await prisma.$transaction(async (trxn) => {
                const invitation = await trxn.invitations.findUnique({
                    where: {
                        id: invitationID
                    },
                    include: {
                        FromUser: {
                            select: {
                                first_name: true,
                                last_name: true,
                                user_code: true
                            }
                        },
                        ToUser: {
                            select: {
                                first_name: true,
                                last_name: true,
                                user_code: true
                            }
                        }
                    }
                });
                
                if (!invitation) {
                    const err = new Error("Invitation not found");
                    err.status = 404;
                    throw err;
                }
                
                // Only the sender can cancel their own invitation
                if (invitation.from_user_id !== userID) {
                    const err = new Error("You can only cancel invitations you sent");
                    err.status = 403;
                    throw err;
                }
                
                // Can only cancel pending invitations
                if (invitation.status !== "PENDING") {
                    const err = new Error("Only pending invitations can be cancelled");
                    err.status = 400;
                    throw err;
                }
                
                // Update invitation status to cancelled
                const updatedInvitation = await trxn.invitations.delete({
                    where: { id: invitationID }
                });
                
                eventEmitter.emit('invitation_status_updated', {
                    invitation: result.invitationData,
                    status: 'CANCELLED',
                    recipientData: result.invitationData.ToUser
                });

                return {
                    invitation: updatedInvitation,
                    invitationData: invitation
                };
            });

            invitationLogger.info(`User ${userID} cancelled invitation ${invitationID} of type ${result.invitationData.type}`);

            return {
                invitation: result.invitation,
                type: result.invitationData.type
            };
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            invitationLogger.error(`Database error in cancelInvite: ${error.message}`);
            throw new Error("Failed to cancel invite");
        }
    }


















    // const invitation = await createInvitation();
    // eventEmitter.emit('invitation_created', invitation);

}

export default invitationService;