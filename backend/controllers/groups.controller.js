import groupService from "../services/groups.service.js";
import Response from "../utils/Response.js";

const groupController = {
    getDetails: async (req, res) => {
        try {
            const groupID = parseInt(req.params.id);

            const groupDetails = await groupService.getDetails(groupID);
            const response = Response.ok(groupDetails, "Group details retrieved successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    getList: async (req, res) => {
        try {
            const groupID = parseInt(req.params.id);

            const groupList = await groupService.getList(groupID);
            const response = Response.ok(groupList, "Group shared list retrieved successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    }, 
    getMembers: async (req, res) => {
        try {
            const groupID = parseInt(req.params.id);

            const groupMembers = await groupService.getMembers(groupID);
            const response = Response.ok(groupMembers, "Group members retrieved successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    getInviteHistory: async (req, res) => {
        try {
            const groupID = parseInt(req.params.id);

            const groupInviteHistory = await groupService.getInviteHistory(groupID);
            const response = Response.ok(groupInviteHistory, "Group invite history retrieved successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    addItem: async (req, res) => {
        try {
            const groupID = parseInt(req.params.id);
            const userID = req.user.id;

            const newItem = await groupService.addItem(userID, groupID, req.body);
            const response = Response.ok(newItem, "Item added to group list successfully");
            return res.status(response.status).json(response.toJSON());            
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    updateGroup: async (req, res) => {
        try {
            const groupID = parseInt(req.params.id);

            const updatedGroupDetails = await groupService.updateGroup(groupID, req.body, req.file);
            const response = Response.ok(updatedGroupDetails, "Group details updated successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    clearList: async (req, res) => {
        try {
            const groupID = parseInt(req.params.id);

            const clearedGroupList = await groupService.clearList(groupID);
            const response = Response.ok(clearedGroupList, "Group list cleared successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    leaveGroup: async (req, res) => {
        try {
            const groupID = parseInt(req.params.id);
            const userID = req.user.id;
        
            const leftUser = await groupService.leaveGroup(userID, groupID);
            const response = Response.ok(leftUser, "Group left successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    disbandGroup: async (req, res) => {
        try {
            const groupID = parseInt(req.params.id);
            const userID = req.user.id;

            const disbandedGroup = await groupService.disbandGroup(userID, groupID);
            const response = Response.ok(disbandedGroup, "Group disbanded successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    }    
};

export default groupController;