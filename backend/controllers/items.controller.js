import itemService from "../services/items.service.js";
import Response from "../utils/Response.js";

const itemController = {
    getItem: async (req, res) => {
        try {
            const itemID = parseInt(req.params.id);
            const itemDetails = await itemService.getItem(itemID);
            const response = Response.ok(itemDetails, "Item details retrieved successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    updateDetails: async (req, res) => {
        try {
            const itemID = parseInt(req.params.id);
            const updatedItem = await itemService.updateDetails(itemID, req.body, req.user.id, req.groupId);
            const response = Response.ok(updatedItem, "Item details retrieved successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());            
        }
    },

    updateStatus: async (req, res) => {
        try {   
            const itemID = parseInt(req.params.id);
            const updatedItem = await itemService.updateStatus(itemID, req.body, req.user.id, req.groupId);
            const response = Response.ok(updatedItem, "Item status updated successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());           
        }
    },

    deleteItem: async (req, res) => {
        try {
            const itemID = parseInt(req.params.id);
            const deletedItem = await itemService.deleteItem(itemID, req.user.id, req.groupId);
            const response = Response.ok(deletedItem, "Item deleted successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());            
        }
    }
};

export default itemController;