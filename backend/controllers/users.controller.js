import userService from "../services/users.service.js";
import Response from "../utils/Response.js";

const userController = {
    getUser: async (req, res) => {
        try {
            const userDetails = await userService.getUser(req.user.id);
            const response = Response.ok(userDetails, "User profile retrieved successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    getGroups: async (req, res) => {
        try {
            const userGroups = await userService.getGroups(req.user.id);
            const response = Response.ok(userGroups, "User groups retrieved successfully");
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
            const userList = await userService.getList(req.user.id);
            const response = Response.ok(userList, "User personal list retrieved successfully");
            return res.status(response.status).json(response.toJSON());

        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    getReceived: async (req, res) => {
        try {
            const userReceived = await userService.getReceived(req.user.id);
            const response = Response.ok(userReceived, "User received invitations retrieved successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    getSent: async (req, res) => {
        try {
            const userSent = await userService.getSent(req.user.id);
            const response = Response.ok(userSent, "User sent invitations retrieved successfully");
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
            const newItem = await userService.addItem(req.user.id, req.body);
            const response = Response.ok(newItem, "Item added to user list successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    updateUser: async (req, res) => {
        try {
            const updatedUserDetails = await userService.updateUser(req.user.id, req.body);
            const response = Response.ok(updatedUserDetails, "User profile updated successfully");
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
            const clearedUserList = await userService.clearList(req.user.id);
            const response = Response.ok(clearedUserList, "User list cleared successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    deleteUser: async (req, res) => {
        try {
            const deletedUser = await userService.deleteUser(req.user.id);
            const response = Response.ok(deletedUser, "User deleted successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    }
};

export default userController;