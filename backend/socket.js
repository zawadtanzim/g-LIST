import { Server } from 'socket.io';
import { supabasePublic } from './config/supabase.js';
import { eventEmitter } from './utils/events.js';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            // Use the same Supabase auth logic as your existing middleware
            const { data, error } = await supabasePublic.auth.getUser(token);
            
            if (error || !data.user) {
                return next(new Error('Authentication error: Invalid token'));
            }

            socket.userId = data.user.id;
            socket.user = data.user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);

        // Join user to their personal room for invitation updates
        socket.join(`user:${socket.userId}`);

        // Handle joining group rooms for list updates
        socket.on('join-group', (groupId) => {
            socket.join(`group:${groupId}`);
            console.log(`User ${socket.userId} joined group:${groupId}`);
        });

        // Handle leaving group rooms
        socket.on('leave-group', (groupId) => {
            socket.leave(`group:${groupId}`);
            console.log(`User ${socket.userId} left group:${groupId}`);
        });

        // Handle user joining multiple groups at once (useful for initial connection)
        socket.on('join-groups', (groupIds) => {
            groupIds.forEach(groupId => {
                socket.join(`group:${groupId}`);
            });
            console.log(`User ${socket.userId} joined groups:`, groupIds);
        });

        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected`);
        });
    });

    // Set up event listeners for your application events
    setupEventListeners();

    return io;
};

const setupEventListeners = () => {
    // INVITATION EVENTS
    
    // When someone receives an invitation
    eventEmitter.on('invitation_received', (invitationData) => {
        const { to_user_id, ...invitation } = invitationData;
        
        io.to(`user:${to_user_id}`).emit('invitation:received', {
            type: 'invitation_received',
            data: invitation,
            timestamp: new Date().toISOString()
        });
        
        console.log(`Sent invitation:received to user:${to_user_id}`);
    });

    // When invitation status changes (accepted, declined, expired)
    eventEmitter.on('invitation_status_updated', ({ invitation, status, recipientData }) => {
        const { from_user_id } = invitation;
        
        io.to(`user:${from_user_id}`).emit('invitation:status_updated', {
            type: 'invitation_status_updated',
            data: {
                invitationId: invitation.id,
                status,
                recipientName: recipientData ? `${recipientData.first_name} ${recipientData.last_name}` : null,
                groupName: invitation.group_name || invitation.Group?.group_name,
                invitationType: invitation.type
            },
            timestamp: new Date().toISOString()
        });
        
        console.log(`Sent invitation:status_updated to user:${from_user_id}`);
    });

    // LIST ITEM EVENTS

    // When item is added to group list
    eventEmitter.on('list_item_added', ({ groupId, item, user }) => {
        io.to(`group:${groupId}`).emit('list:item_added', {
            type: 'list_item_added',
            data: {
                groupId,
                item,
                addedBy: {
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`
                }
            },
            timestamp: new Date().toISOString()
        });
        
        console.log(`Sent list:item_added to group:${groupId}`);
    });

    // When item is updated in group list
    eventEmitter.on('list_item_updated', ({ groupId, item, previousData, user }) => {
        io.to(`group:${groupId}`).emit('list:item_updated', {
            type: 'list_item_updated',
            data: {
                groupId,
                item,
                previousData,
                updatedBy: {
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`
                }
            },
            timestamp: new Date().toISOString()
        });
        
        console.log(`Sent list:item_updated to group:${groupId}`);
    });

    // When item is deleted from group list
    eventEmitter.on('list_item_deleted', ({ groupId, deletedItem, user }) => {
        io.to(`group:${groupId}`).emit('list:item_deleted', {
            type: 'list_item_deleted',
            data: {
                groupId,
                deletedItem,
                deletedBy: {
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`
                }
            },
            timestamp: new Date().toISOString()
        });
        
        console.log(`Sent list:item_deleted to group:${groupId}`);
    });

    // When list is cleared
    eventEmitter.on('list_cleared', ({ groupId, user }) => {
        io.to(`group:${groupId}`).emit('list:cleared', {
            type: 'list_cleared',
            data: {
                groupId,
                clearedBy: {
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`
                }
            },
            timestamp: new Date().toISOString()
        });
        
        console.log(`Sent list:cleared to group:${groupId}`);
    });
};

// Utility functions to emit events from other parts of your app
export const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
};

export const emitToGroup = (groupId, event, data) => {
    if (io) {
        io.to(`group:${groupId}`).emit(event, data);
    }
};

export const getSocketIO = () => io;