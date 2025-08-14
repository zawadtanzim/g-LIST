import prisma from "../config/prisma.js";
import { supabaseAdmin } from "../config/supabase.js";
import { userLogger } from "../utils/logger.js";
import uploadService from "./upload.service.js";

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
        if (!userID) {
            userLogger.warn("getList called without userID");
            const err = new Error("User ID is required");
            err.status = 400;
            throw err;
        }

        try {
            const userList = await prisma.userLists.findUnique({
                where: {
                    user_id: userID
                },
                include: {
                    Lists: {
                        select: {
                            id : true,
                            created_at: true,
                            updated_at: true,
                            Items: {
                                select: {
                                    id: true,
                                    item_name: true,
                                    item_price: true,
                                    item_quantity: true,
                                    item_status: true,
                                    created_at: true,
                                    updated_at: true,
                                },
                                orderBy: {
                                    created_at: "desc"
                                }
                            },
                        }
                    }
                }
            });

            const items = userList.Lists.Items;

            const expected_total = items
                .filter(item => item.item_status === "NEEDED" || item.item_status === "OPTIONAL")
                .reduce((sum, item) => sum + (item.item_price * item.item_quantity), 0);

            const actual_total = items
                .filter(item => item.item_status === "PURCHASED")
                .reduce((sum, item) => sum + (item.item_price * item.item_quantity), 0);

                userList.Lists.expected_total = expected_total;
                userList.Lists.actual_total = actual_total; 

            const list = {  
                ...userList.Lists,
                item_count: userList.Lists.Items.length,
            };

            userLogger.info(`Retrieved list with ${list.item_count} items for user ${userID}`);
            return list; 
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            userLogger.error(`Database error in getList: ${error.message}`);
            throw new Error("Failed to retrieve user list");
        }
    },

    getReceived: async (userID) => {
        if (!userID) {
            userLogger.warn("getReceived called without userID");
            const err = new Error("User ID is required");
            err.status = 400;
            throw err;
        }

        try {
            const receivedInvitations = await prisma.invitations.findMany({
                where: {
                    to_user_id: userID,
                    status: "PENDING"
                },
                select: {
                    id: true,
                    from_user_id: true,
                    type: true,
                    status: true,
                    message: true,
                    created_at: true,
                    expires_at: true,
                    responded_at: true,
                    FromUser: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            profile_pic: true
                        }
                    },
                    Group: {
                        select: {
                            id: true,
                            group_name: true,
                            group_image: true
                        }
                    }
                }
            });

            userLogger.info(`Retrieved ${receivedInvitations.length} received invitations for user ${userID}`);
            return receivedInvitations;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            userLogger.error(`Database error in getReceived: ${error.message}`);
            throw new Error("Failed to retrieve user received invitations");
        }
    },

    getSent: async (userID) => {
        if (!userID) {
            userLogger.warn("getSent called without userID");
            const err = new Error("User ID is required");
            err.status = 400;
            throw err;
        }

        try {
            const sentInvitations = await prisma.invitations.findMany({
                where: {
                    from_user_id: userID,
                    status: "PENDING"
                },
                select: {
                    id: true,
                    from_user_id: true,
                    type: true,
                    status: true,
                    message: true,
                    created_at: true,
                    expires_at: true,
                    responded_at: true,
                    ToUser: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            profile_pic: true
                        }
                    },
                    Group: {
                        select: {
                            id: true,
                            group_name: true,
                            group_image: true
                        }
                    }
                }
            });

            userLogger.info(`Retrieved ${sentInvitations.length} sent invitations for user ${userID}`);
            return sentInvitations;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            userLogger.error(`Database error in getSent: ${error.message}`);
            throw new Error("Failed to retrieve user sent invitations");
        }
    },

    addItem: async (userID, itemData) => {
        if (!userID) {
            userLogger.warn("addItem called without userID");
            const err = new Error("User ID is required");
            err.status = 400;
            throw err;
        }

        const { item_name, item_price, item_quantity, item_status } = itemData;
        
        if (!item_name || !item_quantity){
            userLogger.warn("addItem called without item_name and item_quantity");
            const err = new Error("item_name and item_quantity are required");
            err.status = 400;
            throw err;
        }

        try {
            const newItem = await prisma.$transaction( async (trxn) => {
                const userList = await trxn.userLists.findUnique({
                    where: {
                        user_id: userID
                    }
                });
                
                if (!userList) {
                    const err = new Error("User list not found");
                    err.status = 404;
                    throw err;
                }

                const item = await trxn.items.create({
                    data: {
                        list_id: userList.list_id,
                        user_id: userList.user_id,
                        item_name,
                        item_price: parseFloat(item_price) || null,
                        item_quantity,
                        item_status: item_status || "NEEDED"
                    }
                });

                return item;
            });

            userLogger.info(`Added new item to list for user ${userID}`);
            return newItem;
        }

        catch (error){
            if (error.status) {
                throw error; // Re-throw known errors
            }
            userLogger.error(`Database error in addItem: ${error.message}`);
            throw new Error("Failed to add item to user list");
        }
    },

    updateUser: async (userID, userData, file = null) => {
        if (!userID) {
            userLogger.warn("updateUser called without userID");
            const err = new Error("User ID is required");
            err.status = 400;
            throw err;
        }

        if(!userData && !file){
            userLogger.warn("updateUser called without userData or file");
            const err = new Error("userData or file is required");
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
                    profile_pic: true
                }
            });

            if (!existingUser) {
                const err = new Error("User not found");
                err.status = 404;
                throw err;
            }

            const { first_name, last_name } = userData || {};

            const updateData = {};

            if (first_name) {
                updateData.first_name = first_name;
            }

            if (last_name) {
                updateData.last_name = last_name;
            }

            if (file) {
                if (existingUser.profile_pic){
                    await uploadService.deleteFromStorage('profile-pics', existingUser.profile_pic);
                }

                const profilePicUrl = await uploadService.uploadToStorage('profile-pics', userID, file, 'profile-');
                updateData.profile_pic = profilePicUrl;
            }

            const updatedUser = await prisma.users.update({
                where: { id: userID },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    user_code: true,
                    profile_pic: true,
                    updated_at: true
                }
            });

            userLogger.info(`User updated successfully: ${userID}`);
            return updatedUser;
        }
        catch (error) {
            if (error.status) {
                throw error;
            }
            userLogger.error(`Database error in updateUser: ${error.message}`);
            throw new Error("Failed to update user");
        }
    },

    clearList: async (userID) => {
        if (!userID) {
            userLogger.warn("clearList called without userID");
            const err = new Error("User ID is required");
            err.status = 400;
            throw err;
        }

        try {
            const result = await prisma.$transaction(async (trxn) => {
                const userList = await trxn.userLists.findUnique({
                    where: {
                        user_id: userID
                    }
                });

                if (!userList) {
                    const err = new Error("User list not found");
                    err.status = 404;
                    throw err;
                }

                const deletedItems = await trxn.items.deleteMany({
                    where: {
                        list_id: userList.list_id
                    }
                });

                await trxn.lists.update({
                    where: {
                        id: userList.list_id
                    },
                    data: {
                        expected_total: 0.00,
                        actual_total: 0.00,
                    }
                });

                return {
                    deletedCount: deletedItems.count,
                    message: `Cleared ${deletedItems.count} items from list`
                };
            });

            userLogger.info(`Cleared list for user ${userID}: ${result.deletedCount} items deleted`);
            return result;
        }
        catch (error){
            if (error.status) {
                throw error;
            }
            userLogger.error(`Database error in clearList: ${error.message}`);
            throw new Error("Failed to clear user list");
        }
    },

    deleteUser: async (userID) => {
        if (!userID) {
            userLogger.warn("deleteUser called without userID");
            const err = new Error("User ID is required");
            err.status = 400;
            throw err;
        }

        try {
            await prisma.$transaction(async (trxn) => {
                const userGroups = await trxn.groupMembers.findMany({
                    where: { 
                        user_id: userID 
                    },
                    include: {
                        Groups: {
                            include: {
                                _count: { 
                                    select: { 
                                        GroupMembers: true 
                                    } 
                                }
                            }
                        }
                    }
                });

                const userList = await trxn.userLists.findUnique({
                    where: {
                        user_id: userID
                    }
                });

                if (userList) {
                    await trxn.lists.delete({
                        where: { id: userList.list_id }
                    });
                }
                
                const groupsToDelete = userGroups.filter(membership => 
                    membership.Groups._count.GroupMembers <= 2 
                );
                
                for (const membership of groupsToDelete) {
                    await trxn.groups.delete({ 
                        where: { 
                            id: membership.group_id 
                        } 
                    });
                }
                
                await trxn.users.delete({ 
                    where: { 
                        id: userID 
                    }
                });
            });

            const { error } = await supabaseAdmin.auth.admin.deleteUser(userID);
            if (error) {
                userLogger.error(`Failed to delete Supabase user ${userID}: ${error.message}`);
            } 
            else {
                userLogger.info(`Successfully deleted Supabase auth user: ${userID}`);
            }
        }
        catch (error) {
            if (error.status) {
                throw error;
            }
            userLogger.error(`Database error in deleteUser: ${error.message}`);
            throw new Error("Failed to delete user");
        }
    }
};

export default userService;