"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_IO = exports.SEND_EVENT_TO_ADMINS = exports.SEND_EVENT_TO_MULTIPLE_USERS = exports.SEND_EVENT_TO_USER = exports.INITIALIZE_SOCKET_IO = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const socket_io_1 = require("socket.io");
let io = null;
const connectedUsers = new Map();
const INITIALIZE_SOCKET_IO = (server) => {
    if (io) {
        console.log("Socket.IO already initialized");
        return io;
    }
    io = new socket_io_1.Server(server, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://localhost:8017",
                "http://localhost:8080",
                "https://localhost:5173",
            ],
            credentials: true,
        },
    });
    io.engine.on("connection_error", (err) => {
        console.log("Socket.IO engine connection_error:", {
            code: err.code,
            message: err.message,
            context: err.context,
        });
    });
    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);
        // ============ TYPING EVENTS – USER → ADMIN ============
        socket.on("user:typing", ({ conversation_id }) => {
            if (!io)
                return;
            // bắn cho tất cả admin đang ở room "admins"
            io.to("admins").emit("admin:chat:typing", {
                conversation_id,
                sender_type: "user",
            });
        });
        socket.on("user:stop_typing", ({ conversation_id }) => {
            if (!io)
                return;
            io.to("admins").emit("admin:chat:stop_typing", {
                conversation_id,
                sender_type: "user",
            });
        });
        // ============ TYPING EVENTS – ADMIN → USER ============
        // frontend admin nhớ gửi kèm user_id của cuộc hội thoại
        socket.on("admin:typing", ({ conversation_id, user_id }) => {
            (0, exports.SEND_EVENT_TO_USER)(String(user_id), "chat:typing", {
                conversation_id,
                sender_type: "admin",
            });
        });
        socket.on("admin:stop_typing", ({ conversation_id, user_id }) => {
            (0, exports.SEND_EVENT_TO_USER)(String(user_id), "chat:stop_typing", {
                conversation_id,
                sender_type: "admin",
            });
        });
        socket.on("register_user", (userId) => {
            if (!userId)
                return;
            if (!connectedUsers.has(userId)) {
                connectedUsers.set(userId, new Set());
                io.emit(userId, "user-online");
            }
            connectedUsers.get(userId).add(socket.id);
            console.log(`Socket ${socket.id} registered for user ${userId}. Total sockets: ${connectedUsers.get(userId).size}`);
        });
        socket.on("register_admin", () => {
            socket.join("admins");
            console.log(`Socket ${socket.id} joined admins room`);
        });
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
            for (const [userId, socketSet] of connectedUsers.entries()) {
                if (socketSet.has(socket.id)) {
                    socketSet.delete(socket.id);
                    if (socketSet.size === 0) {
                        connectedUsers.delete(userId);
                        io.emit(userId, "user-offline");
                    }
                    break;
                }
            }
        });
    });
    console.log("Socket.IO initialized");
    return io;
};
exports.INITIALIZE_SOCKET_IO = INITIALIZE_SOCKET_IO;
const SEND_EVENT_TO_USER = (userId, eventName, data) => {
    if (!io)
        return;
    const socketSet = connectedUsers.get(userId);
    if (socketSet && socketSet.size > 0) {
        socketSet.forEach((socketId) => {
            io.to(socketId).emit(eventName, data);
        });
    }
};
exports.SEND_EVENT_TO_USER = SEND_EVENT_TO_USER;
const SEND_EVENT_TO_MULTIPLE_USERS = (userIds, eventName, data) => {
    if (!io)
        return;
    userIds.forEach((userId) => {
        const socketSet = connectedUsers.get(userId);
        if (socketSet && socketSet.size > 0) {
            socketSet.forEach((socketId) => {
                io.to(socketId).emit(eventName, data);
            });
        }
    });
};
exports.SEND_EVENT_TO_MULTIPLE_USERS = SEND_EVENT_TO_MULTIPLE_USERS;
const SEND_EVENT_TO_ADMINS = (eventName, data) => {
    if (!io)
        return;
    io.to("admins").emit(eventName, data);
};
exports.SEND_EVENT_TO_ADMINS = SEND_EVENT_TO_ADMINS;
const GET_IO = () => {
    if (!io)
        throw new Error("Socket.IO not initialized!");
    return io;
};
exports.GET_IO = GET_IO;
