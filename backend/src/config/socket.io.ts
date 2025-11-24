/* eslint-disable @typescript-eslint/no-explicit-any */
import { Server } from "socket.io";
import type http from "http";

let io: Server | null = null;


const connectedUsers = new Map<string, Set<string>>();

export const INITIALIZE_SOCKET_IO = (server: http.Server) => {
    if (io) {
        console.log("Socket.IO already initialized");
        return io;
    }

    io = new Server(server, {
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
            if (!io) return;
            // bắn cho tất cả admin đang ở room "admins"
            io.to("admins").emit("admin:chat:typing", {
                conversation_id,
                sender_type: "user",
            });
        });

        socket.on("user:stop_typing", ({ conversation_id }) => {
            if (!io) return;
            io.to("admins").emit("admin:chat:stop_typing", {
                conversation_id,
                sender_type: "user",
            });
        });

        // ============ TYPING EVENTS – ADMIN → USER ============
        // frontend admin nhớ gửi kèm user_id của cuộc hội thoại
        socket.on("admin:typing", ({ conversation_id, user_id }) => {
            SEND_EVENT_TO_USER(String(user_id), "chat:typing", {
                conversation_id,
                sender_type: "admin",
            });
        });

        socket.on("admin:stop_typing", ({ conversation_id, user_id }) => {
            SEND_EVENT_TO_USER(String(user_id), "chat:stop_typing", {
                conversation_id,
                sender_type: "admin",
            });
        });


        socket.on("register_user", (userId: string) => {
            if (!userId) return;

            if (!connectedUsers.has(userId)) {
                connectedUsers.set(userId, new Set());
                io!.emit(userId, "user-online");
            }
            connectedUsers.get(userId)!.add(socket.id);
            console.log(
                `Socket ${socket.id} registered for user ${userId}. Total sockets: ${connectedUsers.get(userId)!.size
                }`
            );
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
                        io!.emit(userId, "user-offline");
                    }
                    break;
                }
            }
        });
    });

    console.log("Socket.IO initialized");
    return io;
};

export const SEND_EVENT_TO_USER = (
    userId: string,
    eventName: string,
    data: any
) => {
    if (!io) return;
    const socketSet = connectedUsers.get(userId);
    if (socketSet && socketSet.size > 0) {
        socketSet.forEach((socketId) => {
            io!.to(socketId).emit(eventName, data);
        });
    }
};

export const SEND_EVENT_TO_MULTIPLE_USERS = (
    userIds: string[],
    eventName: string,
    data: any
) => {
    if (!io) return;
    userIds.forEach((userId) => {
        const socketSet = connectedUsers.get(userId);
        if (socketSet && socketSet.size > 0) {
            socketSet.forEach((socketId) => {
                io!.to(socketId).emit(eventName, data);
            });
        }
    });
};

export const SEND_EVENT_TO_ADMINS = (eventName: string, data: any) => {
    if (!io) return;
    io.to("admins").emit(eventName, data);
};

export const GET_IO = () => {
    if (!io) throw new Error("Socket.IO not initialized!");
    return io;
};
