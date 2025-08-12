import { supabasePublic } from "../config/supabase.js";
import prisma from "../config/prisma.js";
import { generateCode } from "../utils/codeGenerator.js";
import { authLogger } from "../utils/logger.js";

// const createUserWithUniqueCode = async (userData, maxRetries = 3) => {
//     for (let attempt = 0; attempt < maxRetries; attempt++) {
//         try {
//             return await prisma.users.create({
//                 data: {
//                     ...userData,
//                     user_code: generateCode("user")
//                 }
//             });
//         } catch (error) {
//             if (error.code === 'P2002' && error.meta?.target?.includes('user_code')) {
//                 if (attempt === maxRetries - 1) {
//                     authLogger.error(`Failed to generate unique user code after ${maxRetries} attempts`);
//                     throw new Error('Failed to generate unique user code');
//                 }
//                 authLogger.warn(`User code collision on attempt ${attempt + 1}, retrying...`);
//                 continue;
//             }
//             throw error; 
//         }
//     }
// }

const authService = {
    getUser: async (userID) => {
        if (!userID) {
            authLogger.warn("getUser called without userID");
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
                authLogger.warn(`User not found: ${userID}`);
                const err = new Error("User not found");
                err.status = 404;
                throw err;
            }

            authLogger.info(`User profile retrieved: ${existingUser.email}`);
            return existingUser;   
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            authLogger.error(`Database error in getUser: ${error.message}`);
            throw new Error("Failed to retrieve user");
        }
    }, 

    signUp: async (userData) => {
        const { email, password, first_name, last_name } = userData;
        if (!email || !password || !first_name || !last_name){
            authLogger.warn(`Incomplete signup attempt: ${email || 'no email'}`);
            const err = new Error("Missing required field: Email, Password, First Name, or Last Name");
            err.status = 400;
            throw err;
        }

        try {
            authLogger.info(`Registration attempt: ${email}`);

            const supabaseStart = Date.now();
            const { data, error } = await supabasePublic.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name,
                        last_name
                    }
                }
            });

            const supabaseTime = Date.now() - supabaseStart;
            authLogger.info(`Supabase signup took: ${supabaseTime}ms`);

            if (error) {
                authLogger.warn(`Supabase signup failed for ${email}: ${error.message}`);
                let status = 400;
                let message = error.message;

                if (error.message.includes("already registered")) {
                    status = 409;
                    message = "Email is already registered."
                }

                const err = new Error(message);
                err.status = status;
                throw err;
            }
            let newUser;


            if (data.user) {
                const prismaStart = Date.now();
                await prisma.$transaction(async (trxn) => {
                    try {
                        newUser = await trxn.users.create({
                            data: {
                                id: data.user.id,
                                email,
                                first_name,
                                last_name,
                                user_code: generateCode("user")
                            }
                        });

                        const defaultList = await trxn.lists.create({
                            data: {
                                expected_total: 0.00,
                                actual_total: 0.00
                            }
                        });

                        await trxn.userLists.create({
                            data: {
                                user_id: newUser.id,
                                list_id: defaultList.id,
                                interval_time: new Date('1970-01-01T09:00:00Z'),
                                interval_freq: "WEEKLY"
                            }
                        })
                    }
                    catch (error) {
                        throw error
                    }
                });
                
                const prismaTime = Date.now() - prismaStart;
                authLogger.info(`Prisma creation took: ${prismaTime}ms`);
                authLogger.info(`User registered successfully: ${email} (${newUser.user_code})`);
            }

            return {
                user: newUser,
                tokens: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_in: data.session.expires_in,
                    expires_at: data.session.expires_at,
                }
            }
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            authLogger.error(`Registration error for ${email}: ${error.message}`);
            throw new Error("Registration failed");
        }
    },

    signIn: async (credentials) => {
        const { email, password } = credentials;

        if (!email || !password) {
            authLogger.warn(`Incomplete signin attempt: ${email || 'no email'}`);
            const err = new Error("Email and password are required");
            err.status = 400;
            throw err;
        }

        try {
            authLogger.info(`Login attempt: ${email}`);

            const { data, error } = await supabasePublic.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                authLogger.warn(`Login failed for ${email}: ${error.message}`);
                const err = new Error("Invalid email or password");
                err.status = 401;
                throw err;
            }

            if (!data.user) {
                authLogger.error(`Authentication failed for ${email}: no user returned`);
                const err = new Error("Authentication failed");
                err.status = 401;
                throw err;
            }

            const user = await prisma.users.findUnique({
                where: {
                    id: data.user.id
                },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    user_code: true,
                    created_at: true
                }
            });

            authLogger.info(`User logged in successfully: ${email}`);
            return {
                user,
                tokens: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_in: data.session.expires_in,
                    expires_at: data.session.expires_at,
                }
            };
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            authLogger.error(`Login error for ${email}: ${error.message}`);
            throw new Error("Login failed");
        }
    },

    signOut: async (token) => {
        if (!token) {
            authLogger.warn("Sign out attempted without access token");
            const err = new Error("Access token is required");
            err.status = 400;
            throw err;
        }

        try {
            const { error } = await supabasePublic.auth.signOut({ access_token: token });

            if (error) {
                authLogger.warn(`Signout failed: ${error.message}`);
                const err = new Error("Invalid or expired token.");
                err.status = 401;
                throw err;
            }

            authLogger.info("User signed out successfully")
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            }
            authLogger.error(`Signout error: ${error.message}`);
            throw new Error("Signout failed");
        }
    },

    refreshToken: async (refreshToken) => {
        console.log(refreshToken);
        if (!refreshToken) {
            authLogger.warn("Token refresh attempted without refresh token");
            const err = new Error("Refresh token is required");
            err.status = 400;
            throw err;
        }

        try {
            authLogger.info("Token refresh attempt");
            const { data, error } = await supabasePublic.auth.refreshSession({
                refresh_token: refreshToken
            });

            if (error) {
                authLogger.warn(`Token refresh failed: ${error.message}`);
                const err = new Error("Invalid or expired refresh token");
                err.status = 401;
                throw err;
            }

            authLogger.info("Token refreshed successfully");
            return {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token
            }
        }
        catch (error) {
            if (error.status) {
                throw error; // Re-throw known errors
            } 
            authLogger.error(`Token refresh error: ${error.message}`);
            throw new Error("Token refresh failed");
        }
        
    }
}

export default authService;