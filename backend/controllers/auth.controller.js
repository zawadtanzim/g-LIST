import authService from "../services/auth.service.js"
import Response from "../utils/Response.js";

const authController = {
    me: async (req, res) => {
        try {
            const existingUser = await authService.getUser(req.user.id);
            const response = Response.ok(existingUser, "User profile retrieved successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    signup: async (req, res) => {
        try {
            const newUser = await authService.signUp(req.body);
            const response = Response.created(newUser, "User registered successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    signin: async (req, res) => {
        try {
            const existingUser = await authService.signIn(req.body);
            const response = Response.ok(existingUser, "Signed in successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    signout: async (req, res) => {
        try {
            await authService.signOut(req.token);
            const response = Response.ok(null, "Signed out successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    },

    refresh: async (req, res) => {
        try {
            const { refresh_token } = req.body;
            const newToken = await authService.refreshToken(refresh_token);
            const response = Response.ok(newToken, "Token refreshed successfully");
            return res.status(response.status).json(response.toJSON());
        }
        catch (error) {
            const status = error.status || 500;
            const response = new Response({ status }, error.message);
            return res.status(response.status).json(response.toJSON());
        }
    }
};

export default authController;