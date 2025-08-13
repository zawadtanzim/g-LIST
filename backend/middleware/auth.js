import { supabasePublic } from "../config/supabase.js"
import Response from "../utils/Response.js";
import prisma from "../config/prisma.js";

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        const response = Response.unauthorized("Authorization header required");
        return res.status(response.status).json(response.toJSON());
    }

    if (!authHeader.startsWith("Bearer ")) {
        const response = Response.unauthorized("Invalid authorization format. Use: Bearer <token>");
        return res.status(response.status).json(response.toJSON());
    }

    const token = authHeader.substring(7);

    if (!token) {
        const response = Response.unauthorized("Token required");
        return res.status(response.status).json(response.toJSON());
    }

    const { data, error } = await supabasePublic.auth.getUser(token);

    if (error) {
        const response = Response.unauthorized("Invalid or expired token");
        return res.status(response.status).json(response.toJSON());
    }

    if (!data.user) {
        const response = Response.unauthorized("Invalid token");
        return res.status(response.status).json(response.toJSON());
    }

    req.user = data.user;
    req.token = token;

    next();
}

export const requireUserOwnership = async (req, res, next) => {
    console.log("Full req.params:", req.params);  // See all params
    console.log("req.url:", req.url);              // See the actual URL
    console.log("req.route.path:", req.route?.path); // See the route pattern

    const userID = req.user.id;
    const requestedUserDataID = req.params.id;
    console.log(userID, requestedUserDataID)

    if (!userID || !requestedUserDataID) {
        const response = new Response({ status: 400 }, "Missing user_id or requested_user_data_id");
        return res.status(response.status).json(response.toJSON());
    }

    if (userID === requestedUserDataID) {
        return next();
    }
    
    const response = new Response({ status: 403}, "You can only access your own data");
    return res.status(response.status).json(response.toJSON());
}

export const requireGroupMember = async (req, res, next) => {
    const userID = req.user.id;
    const groupID = parseInt(req.body?.from_group_id || req.params.id);

    if (!userID || !groupID) {
        const response = new Response({ status: 400 }, "Missing user_id or group_id");
        return res.status(response.status).json(response.toJSON());
    }

    const members = await prisma.groupMembers.findUnique({
        where: {
            user_id_group_id: {
                user_id: userID,
                group_id: groupID
            }
        }
    });

    if (!members) {
        const response = new Response({ status: 403 }, "You must be a group member to access this resource");
        return res.status(response.status).json(response.toJSON());
    }

    next();
}

export const requireInvitationParticipant = async (req, res, next) => {
    const userID = req.user.id;
    const invitationID = Number(req.params.id);

    
    if (!userID || !invitationID) {
        const response = new Response({ status: 400 }, "Missing user_id or invitation_id");
        return res.status(response.status).json(response.toJSON());
    }

    const invitation = await prisma.invitations.findUnique({
        where: { id: invitationID },
        select: {
            from_user_id: true,
            to_user_id: true
        }
    });

    if (!invitation) {
        const response = new Response({ status: 404 }, "Invitation not found");
        return res.status(response.status).json(response.toJSON());
    }

    if (invitation.from_user_id === userID || invitation.to_user_id === userID) {
        return next();
    }

    const response = new Response({ status: 403 }, "You can only access invitations you sent or received");
    return res.status(response.status).json(response.toJSON());
}

export const requireItemAccess = async (req, res, next) => {
    try {
        const userID = req.user.id;
        const itemID = Number(req.params.id);
        console.log(userID, itemID);
        
        if (!userID || !itemID || isNaN(itemID)) {
            const response = new Response({ status: 400 }, "Missing user ID or item ID");
            return res.status(response.status).json(response.toJSON());
        }
        
        const item = await prisma.items.findUnique({
            where: { 
                id: itemID 
            },
            include: {
                Lists: {
                    include: {
                        UserLists: true,   // Personal list
                        GroupLists: true   // Group list
                    }
                }
            }
        });
        
        if (!item) {
            const response = new Response({ status: 404 }, "Item not found");
            return res.status(response.status).json(response.toJSON());
        }
        
        if (item.Lists.UserLists) {
            if (item.Lists.UserLists.user_id !== userID) {
                const response = new Response({ status: 403 }, "You can only access your own list items");
                return res.status(response.status).json(response.toJSON());
            }
        }
        else if (item.Lists.GroupLists) {
            const membership = await prisma.groupMembers.findUnique({
                where: {
                    user_id_group_id: {
                        user_id: userID,
                        group_id: item.Lists.GroupLists.group_id
                    }
                }
            });
            
            if (!membership) {
                const response = new Response({ status: 403 }, "You must be a group member to access this item");
                return res.status(response.status).json(response.toJSON());
            }
            
            req.groupId = item.Lists.GroupLists.group_id;
        }
        else {
            const response = new Response({ status: 400 }, "Item belongs to an invalid list type");
            return res.status(response.status).json(response.toJSON());
        }
        
        req.item = item;
        req.listId = item.list_id;
        next();
        
    } catch (error) {
        console.error("requireItemAccess middleware error:", error);
        const response = new Response({ status: 500 }, "Authorization check failed");
        return res.status(response.status).json(response.toJSON());
    }
};