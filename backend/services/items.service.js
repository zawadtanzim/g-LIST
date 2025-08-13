import prisma from "../config/prisma.js";
import { itemLogger } from "../utils/logger.js";

const itemService = {
    getItem: async (itemID) => {
        if (!itemID) {
            itemLogger.warn("getItem called without itemID");
            const err = new Error("Item ID is required");
            err.status = 400;
            throw err;
        }

        try {
            const existingItem = await prisma.items.findUnique({
                where: {
                    id: itemID
                },
                select: {
                    id: true,
                    item_name: true,
                    item_price: true,
                    item_quantity: true,
                    item_status: true,
                    list_id: true,
                    user_id: true,
                    created_at: true,
                    updated_at: true
                }
            });

            if(!existingItem){
                itemLogger.warn(`Item with id: ${itemID} was not found`);
                const err = new Error("Item not found");
                err.status = 404;
                throw err;
            }

            itemLogger.info(`Retrieved item with id: ${existingItem.id}`);
            return existingItem;
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            itemLogger.error(`Database error in getItem: ${error.message}`);
            throw new Error("Failed to retrieve item");
        }
    },

    updateDetails: async (itemID, itemData) => {
        if (!itemID) {
            itemLogger.warn("updateDetails called without itemID");
            const err = new Error("Item ID is required");
            err.status = 400;
            throw err;
        }

        const { item_name, item_price, item_quantity, item_status } = itemData;

        if (!item_name && !item_quantity && !item_price && !item_status) {
            itemLogger.warn("updateDetails called without any updatable fields");
            const err = new Error("At least one field (item_name, item_price, item_quantity, item_status) is required");
            err.status = 400;
            throw err;
        }

        try {
            const result = await prisma.$transaction(async (trxn) => {
                const existingItem = await trxn.items.findUnique({
                    where: {
                        id: itemID
                    },
                    select: {
                        id: true,
                        list_id: true
                    }
                });

                if (!existingItem) {
                    itemLogger.warn(`Item with id: ${itemID} was not found`);
                    const err = new Error("Item not found");
                    err.status = 404;
                    throw err;
                }

                const updatedItem = await trxn.items.update({
                    where: {
                        id: itemID
                    },
                    data: {
                        ...(item_name && { item_name }),
                        ...(item_quantity !== undefined && { item_quantity }),
                        ...(item_price !== undefined && { item_price }),
                        ...(item_status && { item_status })  
                    },
                    select: {
                        id: true,
                        item_name: true,
                        item_price: true,
                        item_quantity: true,
                        item_status: true,
                        list_id: true,
                        user_id: true,
                        created_at: true,
                        updated_at: true
                    }
                });

                const allItems = await trxn.items.findMany({
                    where: { 
                        list_id: existingItem.list_id 
                    },
                    select: {
                        item_price: true,
                        item_quantity: true,
                        item_status: true
                    }
                });

                let expected_total = 0;
                let actual_total = 0;

                allItems.forEach(item => {
                    const price = parseFloat(item.item_price) || 0;
                    const quantity = parseInt(item.item_quantity) || 0;
                    const itemTotal = price * quantity; 

                    if (["NEEDED", "OPTIONAL"].includes(item.item_status)) {
                        expected_total += itemTotal;
                    }
                    if (item.item_status === "PURCHASED") {
                        actual_total += itemTotal;
                    }
                });

                expected_total = Math.round(expected_total * 100) / 100;
                actual_total = Math.round(actual_total * 100) / 100;

                await trxn.lists.update({
                    where: { id: existingItem.list_id },
                    data: { expected_total, actual_total }
                });

                return {
                    updatedItem,
                    updated_totals: { 
                        expected_total,
                        actual_total
                    }
                };
            });

            itemLogger.info(`Item updated successfully: ${itemID}`);
            return {
                ...result.updatedItem,
                updated_totals: result.updated_totals
            }
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            itemLogger.error(`Database error in updateDetails: ${error.message}`);
            throw new Error("Failed to update item details");            
        }
    },

    updateStatus: async (itemID, itemStatus) => {
        if (!itemID) {
            itemLogger.warn("updateStatus called without itemID");
            const err = new Error("Item ID is required");
            err.status = 400;
            throw err;
        }

        const { item_status } = itemStatus;

        if (!item_status) {
            itemLogger.warn("updateStatus called without item_status");
            const err = new Error("item_status is required");
            err.status = 400;
            throw err;
        }

        try {
            const result = await prisma.$transaction(async (trxn) => {
                const existingItem = await trxn.items.findUnique({
                    where: {
                        id: itemID
                    },
                    select: {
                        id: true,
                        list_id: true
                    }
                });

                if (!existingItem) {
                    itemLogger.warn(`Item with id: ${itemID} was not found`);
                    const err = new Error("Item not found");
                    err.status = 404;
                    throw err;
                }

                const updatedItem = await trxn.items.update({
                    where: {
                        id: itemID
                    },
                    data: {
                        item_status: item_status
                    },
                    select: {
                        id: true,
                        item_name: true,
                        item_price: true,
                        item_quantity: true,
                        item_status: true,
                        list_id: true,
                        user_id: true,
                        created_at: true,
                        updated_at: true
                    }
                });

                const allItems = await trxn.items.findMany({
                    where: { 
                        list_id: existingItem.list_id 
                    },
                    select: {
                        item_price: true,
                        item_quantity: true,
                        item_status: true
                    }
                });

                let expected_total = 0;
                let actual_total = 0;

                allItems.forEach(item => {
                    const price = parseFloat(item.item_price) || 0;
                    const quantity = parseInt(item.item_quantity) || 0;
                    const itemTotal = price * quantity; 

                    if (["NEEDED", "OPTIONAL"].includes(item.item_status)) {
                        expected_total += itemTotal;
                    }
                    if (item.item_status === "PURCHASED") {
                        actual_total += itemTotal;
                    }
                });

                expected_total = Math.round(expected_total * 100) / 100;
                actual_total = Math.round(actual_total * 100) / 100;

                await trxn.lists.update({
                    where: { id: existingItem.list_id },
                    data: { expected_total, actual_total }
                });

                return {
                    updatedItem,
                    updated_totals: { 
                        expected_total,
                        actual_total
                    }
                };
            });

            itemLogger.info(`Item updated successfully: ${itemID}`);
            return  {
                ...result.updatedItem,
                updated_totals: result.updated_totals
            }
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            itemLogger.error(`Database error in updateStatus: ${error.message}`);
            throw new Error("Failed to update item status");            
        }
    },

    deleteItem: async (itemID) => {
        if (!itemID) {
            itemLogger.warn("deleteItem called without itemID");
            const err = new Error("Item ID is required");
            err.status = 400;
            throw err;
        }

        try {
            const deletedItem = await prisma.$transaction(async (trxn) => {
                const item = await trxn.items.findUnique({
                    where: { id: itemID },
                    include: {
                        Users: {
                            select: {
                                first_name: true,
                                last_name: true,
                                user_code: true
                            }
                        },
                        Lists: {
                            select: {
                                id: true,
                                expected_total: true,
                                actual_total: true
                            }
                        }
                    }
                });
                
                if (!item) {
                    const err = new Error("Item not found");
                    err.status = 404;
                    throw err;
                }
                
                const deleted = await trxn.items.delete({
                    where: { id: itemID }
                });
                
                const remainingItems = await trxn.items.findMany({
                    where: { list_id: item.list_id },
                    select: {
                        item_price: true,
                        item_quantity: true,
                        item_status: true
                    }
                });

                let expected_total = 0;
                let actual_total = 0;

                remainingItems.forEach(remainingItem => {
                    const price = parseFloat(remainingItem.item_price) || 0;
                    const quantity = parseInt(remainingItem.item_quantity) || 0;
                    const itemTotal = price * quantity; 

                    if (["NEEDED", "OPTIONAL"].includes(remainingItem.item_status)) {
                        expected_total += itemTotal;
                    }
                    if (remainingItem.item_status === "PURCHASED") {
                        actual_total += itemTotal;
                    }
                });

                expected_total = Math.round(expected_total * 100) / 100;
                actual_total = Math.round(actual_total * 100) / 100;
            
                await trxn.lists.update({
                    where: { id: item.list_id },
                    data: {
                        expected_total,
                        actual_total
                    }
                });
                
                return {
                    deletedItem: deleted,
                    itemDetails: item,
                    updatedTotals: {
                        expected_total,
                        actual_total
                    }
                };
            });
            
            itemLogger.info(`Deleted item ${itemID} "${deletedItem.itemDetails.item_name}" from list ${deletedItem.itemDetails.list_id}`);
        
            return {
                deleted_item: {
                    id: deletedItem.deletedItem.id,
                    item_name: deletedItem.itemDetails.item_name,
                    item_price: deletedItem.itemDetails.item_price,
                    item_status: deletedItem.itemDetails.item_status
                },
                updated_totals: deletedItem.updatedTotals,
                deleted_by: {
                    first_name: deletedItem.itemDetails.Users.first_name,
                    last_name: deletedItem.itemDetails.Users.last_name,
                    user_code: deletedItem.itemDetails.Users.user_code
                }
            }
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            itemLogger.error(`Database error in deleteItem: ${error.message}`);
            throw new Error("Failed to delete item");            
        }
    }

}

export default itemService;