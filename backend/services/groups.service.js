import prisma from "../config/prisma.js"
import { groupLogger } from "../utils/logger.js";
import uploadService from "./upload.service.js";
import { eventEmitter } from "../utils/events.js";

const groupService = {
    getDetails: async (groupID) => {
        if (!groupID) {
            groupLogger.warn("getDetails called without groupID");
            const err = new Error("Group ID is required");
            err.status = 400;
            throw err;
        }
        try {
            const existingGroup = await prisma.groups.findUnique({
                where: {
                    id: groupID
                },
                select: {
                    id: true,
                    group_name: true,
                    group_code: true,
                    group_image: true,
                    created_at: true,
                    updated_at: true
                }
            });

            if (!existingGroup) {
                groupLogger.warn(`Group not found: ${groupID}`);
                const err = new Error("Group not found");
                err.status = 404;
                throw err;
            }

            groupLogger.info(`Group details retrieved: ${existingGroup.group_name}`);
            return existingGroup;   
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            groupLogger.error(`Database error in getDetails: ${error.message}`);
            throw new Error("Failed to retrieve group details");
        }
    },

    getList: async (groupID) => {
        if (!groupID) {
            groupLogger.warn("getList called without groupID");
            const err = new Error("Group ID is required");
            err.status = 400;
            throw err;
        }
        try {
            const groupList = await prisma.groupLists.findUnique({
                where: {
                    group_id: groupID
                },
                include: {
                    Lists: {
                        select: {
                            id : true,
                            expected_total: true,
                            actual_total: true,
                            created_at: true,
                            updated_at: true,
                            Items: {
                                select: {
                                    id: true,
                                    item_name: true,
                                    item_price: true,
                                    item_quantity: true,
                                    item_status: true,
                                    user_id: true,
                                    created_at: true,
                                    updated_at: true,
                                    Users: {
                                        select: {
                                            first_name: true,
                                            last_name: true,
                                            user_code: true
                                        }
                                    }
                                },
                                orderBy: {
                                    created_at: "desc"
                                }
                            },
                        }
                    }
                }
            });

            const list = {
                ...groupList.Lists,
                item_count: groupList.Lists.Items.length,
            };

            groupLogger.info(`Retrieved list with ${list.item_count} items for group ${groupID}`);
            return list; 
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            groupLogger.error(`Database error in getList: ${error.message}`);
            throw new Error("Failed to retrieve group list");
        }
    },

    getMembers: async (groupID) => {
        if (!groupID) {
            groupLogger.warn("getMembers called without groupID");
            const err = new Error("Group ID is required");
            err.status = 400;
            throw err;
        }
        try {
            const groupMembers = await prisma.groupMembers.findMany({
                where: {
                    group_id: groupID
                },
                include: {
                    Users:{
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            profile_pic: true,
                            user_code: true
                        }
                    }
                },
                orderBy: {
                    joined_at: 'asc'
                }
            });

            const members = {
                members: groupMembers,
                member_count: groupMembers.length
            };
            
            groupLogger.info(`Retrieved ${members.member_count} members in group ${groupID}`);

            return members;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            groupLogger.error(`Database error in getMembers: ${error.message}`);
            throw new Error("Failed to retrieve group members");
        }
    },

    getInviteHistory: async (groupID) => {
        if (!groupID) {
            groupLogger.warn("getInviteHistory called without groupID");
            const err = new Error("Group ID is required");
            err.status = 400;
            throw err;
        }
        try {
            const inviteHistory = await prisma.invitations.findMany({
                where: {
                    group_id: groupID
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
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            const formattedHistory = {
                invitations: inviteHistory,
                total_count: inviteHistory.length,
                pending_count: inviteHistory.filter(inv => inv.status === 'PENDING').length,
                accepted_count: inviteHistory.filter(inv => inv.status === 'ACCEPTED').length,
                declined_count: inviteHistory.filter(inv => inv.status === 'DECLINED').length
            };

            groupLogger.info(`Retrieved ${formattedHistory.total_count} invitations for group ${groupID}`);
            return formattedHistory;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            groupLogger.error(`Database error in getInviteHistory: ${error.message}`);
            throw new Error("Failed to retrieve group invite history");
        }
    },

    addItem: async (userID, groupID, itemData) => {
        if (!userID || !groupID) {
            groupLogger.warn("addItem called without groupID or userID");
            const err = new Error("Group ID and User ID are required");
            err.status = 400;
            throw err;
        }

        const { item_name, item_price, item_quantity, item_status } = itemData;

        if (!item_name || !item_quantity){
            groupLogger.warn("addItem called without item_name and item_quantity");
            const err = new Error("item_name and item_quantity are required");
            err.status = 400;
            throw err;
        }

        try {
            const newItem = await prisma.$transaction( async (trxn) => {
                const groupList = await trxn.groupLists.findUnique({
                    where: {
                        group_id: groupID
                    }
                });
                
                if (!groupList) {
                    const err = new Error("Group list not found");
                    err.status = 404;
                    throw err;
                }

                const item = await trxn.items.create({
                    data: {
                        list_id: groupList.list_id,
                        item_name,
                        item_price: parseFloat(item_price) || null,
                        item_quantity,
                        item_status: item_status || "NEEDED",
                        user_id: userID
                    }
                });

                const addedByUser = await trxn.users.findUnique({
                    where: {
                        id: userID
                    },
                    select: {
                        first_name: true,
                        last_name: true,
                        user_code: true
                    }
                });

                const allItems = await trxn.items.findMany({
                    where: { 
                        list_id: groupList.list_id 
                    },
                    select: {
                        item_price: true,
                        item_quantity: true,
                        item_status: true
                    }
                });

                let expected_total = 0;
                let actual_total = 0;

                allItems.forEach(listItem => {
                    const price = parseFloat(listItem.item_price) || 0;
                    const quantity = parseInt(listItem.item_quantity) || 0;
                    const itemTotal = price * quantity; 

                    if (["NEEDED", "OPTIONAL"].includes(listItem.item_status)) {
                        expected_total += itemTotal;
                    }
                    if (listItem.item_status === "PURCHASED") {
                        actual_total += itemTotal;
                    }
                });

                expected_total = Math.round(expected_total * 100) / 100;
                actual_total = Math.round(actual_total * 100) / 100;

                // Update the list totals
                await trxn.lists.update({
                    where: { 
                        id: groupList.list_id 
                    },
                    data: { 
                        expected_total, actual_total 
                    }
                });

                item.added_by = addedByUser;
                return {
                    item,
                    updated_totals: {
                        expected_total,
                        actual_total
                    }
                };
            });

            eventEmitter.emit('list_item_added', {
                groupID,
                item: newItem,
                user: {
                    id: userID,
                    first_name: newItem.added_by.first_name,
                    last_name: newItem.added_by.last_name
                }
            });

            groupLogger.info(`Added new item to group list for group ${groupID}`);
            return { 
                newItem,
                updated_totals: newItem.updated_totals
            }; 
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            groupLogger.error(`Database error in addItem: ${error.message}`);
            throw new Error("Failed to add item to group list");
        }
    },

    updateGroup: async (groupID, groupData, file) => {
        if (!groupID) {
            groupLogger.warn("updateGroup called without groupID");
            const err = new Error("Group ID is required");
            err.status = 400;
            throw err;
        }

        if(!groupData && !file){
            groupLogger.warn("updateGroup called without groupData or file");
            const err = new Error("groupData or file is required");
            err.status = 400;
            throw err;
        }

        try {
            const existingGroup = await prisma.groups.findUnique({
                where: { 
                    id: groupID
                },
                select: {
                    id: true,
                    group_image: true
                }
            });

            if (!existingGroup) {
                const err = new Error("Group not found");
                err.status = 404;
                throw err;
            }

            const { group_name } = groupData || {};

            const updateData = {};

            if (group_name) {
                updateData.group_name = group_name;
            }

            if (file) {
                if (existingGroup.group_image){
                    await uploadService.deleteFromStorage('group-pics', existingGroup.group_image);
                }

                const groupImageUrl = await uploadService.uploadToStorage('group-pics', groupID, file, 'group-');
                updateData.group_image = groupImageUrl;
            }

            const updatedGroup = await prisma.groups.update({
                where: {
                    id: groupID
                },
                data: updateData,
                select: {
                    id: true,
                    group_name: true,
                    group_code: true,
                    group_image: true,
                    updated_at: true
                }
            });

            groupLogger.info(`Group updated successfully: ${groupID}`);
            return updatedGroup;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            groupLogger.error(`Database error in updateGroup: ${error.message}`);
            throw new Error("Failed to update group details");
        }
    },

    clearList: async (groupID, userID) => {
        if (!groupID) {
            groupLogger.warn("clearList called without groupID");
            const err = new Error("Group ID is required");
            err.status = 400;
            throw err;
        }
        try {
            const result = await prisma.$transaction(async (trxn) => {
                const groupList = await trxn.groupLists.findUnique({
                    where: {
                        group_id: groupID
                    }
                });

                if (!groupList) {
                    const err = new Error("Group list not found");
                    err.status = 404;
                    throw err;
                }

                const deletedItems = await trxn.items.deleteMany({
                    where: {
                        list_id: groupList.list_id
                    }
                });

                await trxn.lists.update({
                    where: {
                        id: groupList.list_id
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

            const user = await prisma.users.findUnique({
                where: { id: userID },
                select: { first_name: true, last_name: true }
            });
            
            eventEmitter.emit('list_cleared', {
                groupID,
                user: {
                    id: userID,
                    first_name: user?.first_name || 'Unknown',
                    last_name: user?.last_name || 'User'
                }
            });

            groupLogger.info(`Cleared list for group ${groupID}: ${result.deletedCount} items deleted`);
            return result;           
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            groupLogger.error(`Database error in clearList: ${error.message}`);
            throw new Error("Failed to clear group list");
        }
    },

    leaveGroup: async (userID, groupID) => {
        if (!groupID || !userID) {
            groupLogger.warn("leaveGroup called without groupID or userID");
            const err = new Error("Group ID and User ID are required");
            err.status = 400;
            throw err;
        }
        try {
            const result = await prisma.$transaction(async (trxn) => {
                const group = await trxn.groups.findUnique({
                    where: { 
                        id: groupID 
                    },
                    include: {
                        GroupMembers: {
                            include: {
                                Users: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                        user_code: true
                                    }
                                }
                            }
                        }
                    }
                });
                
                if (!group) {
                    const err = new Error("Group not found");
                    err.status = 404;
                    throw err;
                }
                
                const memberCount = group.GroupMembers.length;

                if(memberCount - 1 <= 1){
                    const groupList = await trxn.groupLists.findUnique({
                        where: { 
                            group_id: groupID 
                        }
                    });
                    
                    if (groupList) {
                        await trxn.items.deleteMany({
                            where: { 
                                list_id: groupList.list_id 
                            }
                        });
                        
                        await trxn.lists.deleteMany({
                            where: { 
                                id: groupList.list_id 
                            }
                        });
                        
                        await trxn.groupLists.deleteMany({
                            where: { 
                                group_id: groupID 
                            }
                        });
                    }
                    
                    const deletedInvitations = await trxn.invitations.deleteMany({
                        where: { 
                            group_id: groupID
                        }
                    });
                    
                    const deletedMemberships = await trxn.groupMembers.deleteMany({
                        where: {
                            group_id: groupID
                        }
                    });
                    
                    const deletedGroup = await trxn.groups.delete({
                        where: { 
                            id: groupID 
                        }
                    });
                    
                    return {
                        group: group,
                        remaining_members: 0
                    };
                }
                else {
                    await trxn.groupMembers.delete({
                        where: {
                            user_id_group_id: {
                                user_id: userID,
                                group_id: groupID
                            }
                        }
                    });
                    
                    return {
                        group: group,
                        remaining_members: memberCount - 1
                    };
                }
            });
            
            groupLogger.info(`User ${userID} left group ${groupID}.`);

            return {
                group_name: result.group.group_name,
                group_code: result.group.group_code,
                remaining_members: result.remaining_members
            };
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            groupLogger.error(`Database error in leaveGroup: ${error.message}`);
            throw new Error("Failed to leave group");
        }
    },

    disbandGroup: async (userID, groupID) => {
        if (!groupID || !userID) {
            groupLogger.warn("disbandGroup called without groupID or userID");
            const err = new Error("Group ID and UserID are required");
            err.status = 400;
            throw err;
        }

        try {
            const result = await prisma.$transaction(async (trxn) => {
                const group = await trxn.groups.findUnique({
                    where: { 
                        id: groupID 
                    },
                    include: {
                        GroupMembers: {
                            include: {
                                Users: {
                                    select: {
                                        id: true,
                                        first_name: true,
                                        last_name: true
                                    }
                                }
                            }
                        }
                    }
                });
                
                if (!group) {
                    const err = new Error("Group not found");
                    err.status = 404;
                    throw err;
                }
                
                const memberList = group.GroupMembers.map(member => ({
                    user_id: member.user_id,
                    name: `${member.Users.first_name} ${member.Users.last_name}`,
                    user_code: member.Users.user_code
                }));
                
                const groupList = await trxn.groupLists.findUnique({
                    where: { 
                        group_id: groupID 
                    }
                });
                
                if (groupList) {
                    const deletedItems = await trxn.items.deleteMany({
                        where: { 
                            list_id: groupList.list_id 
                        }
                    });
                    
                    await trxn.lists.deleteMany({
                        where: { 
                            id: groupList.list_id 
                        }
                    });
                    
                    await trxn.groupLists.deleteMany({
                        where: { 
                            group_id: groupID 
                        }
                    });
                    
                    groupLogger.info(`Deleted ${deletedItems.count} items from group ${groupID} list`);
                }
                
                const deletedInvitations = await trxn.invitations.deleteMany({
                    where: { 
                        group_id: groupID 
                    }
                });
                
                await trxn.groupMembers.deleteMany({
                    where: { 
                        group_id: groupID 
                    }
                });
                
                const deletedGroup = await trxn.groups.delete({
                    where: { 
                        id: groupID 
                    }
                });
                
                return {
                    group: deletedGroup,
                    members: memberList,
                    member_count: memberList.length,
                    deleted_invitations: deletedInvitations.count,
                    disbanded_by: memberList.find(member => member.user_id === userID).name
                };
            });

            groupLogger.info(`Group ${groupID} "${result.group.group_name}" disbanded by user ${result.disbanded_by}. ${result.member_count} members affected.`);
        
            return result;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            groupLogger.error(`Database error in disbandGroup: ${error.message}`);
            throw new Error("Failed to disbandGroup");
        }
    },
};

export default groupService;