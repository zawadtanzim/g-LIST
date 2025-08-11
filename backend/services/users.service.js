import prisma from "../config/prisma.js";
import { supabasePublic } from "../config/supabase.js";
import { userLogger } from "../utils/logger.js";

const userService = {
    getUser: async (userID) => {
        if (!userID) {
            userLogger.warn("getUser called without userID");
            const err = new Error("User ID is required");
            err.status = 400;
            throw err;
        }

        try {
            const existingUser = await prisma.users.findUnique({
                where: {
                    id: userID
                },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    user_code: true,
                    profile_pic: true,
                    created_at: true,
                    updated_at: true
                }
            });

            if (!existingUser) {
                userLogger.warn(`User not found: ${userID}`);
                const err = new Error("User not found");
                err.status = 404;
                throw err;
            }

            userLogger.info(`User profile retrieved: ${existingUser.email}`);
            return existingUser;   
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            userLogger.error(`Database error in getUser: ${error.message}`);
            throw new Error("Failed to retrieve user");
        }
    },

    getGroups: async (userID) => {
        if (!userID) {
            userLogger.warn("getGroups called without userID");
            const err = new Error("User ID is required");
            err.status = 400;
            throw err;
        }

        try {
            const userGroups = await prisma.groupMembers.findMany({
                where: {
                    user_id: userID
                },
                include: {
                    Groups: {
                        select: {
                            id : true,
                            group_name: true,
                            group_code: true,
                            group_image: true,
                            created_at: true,
                            updated_at: true,
                            _count: {
                                select: {
                                    GroupMembers: true
                                }
                            }
                        }
                    }
                }
            });

            const groups = userGroups.map(membership => ({
                ...membership.Groups,
                member_count: membership.Groups._count.GroupMembers,
                joined_at: membership.joined_at
            }));

            userLogger.info(`Retrieved ${groups.length} groups for user ${userID}`);
            return groups;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            userLogger.error(`Database error in getGroups: ${error.message}`);
            throw new Error("Failed to retrieve user groups");
        }
    },

    getList: async (userID) => {

    },

    getReceived: async (userID) => {

    },

    getSent: async (userID) => {

    },

    addItem: async (userID, itemData) => {

    },

    updateUser: async (userID, userData) => {

    },

    clearList: async (userID) => {

    },

    deleteUser: async (userID) => {

    }
}

export default userService;