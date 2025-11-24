// src/hooks/use-socket.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";

const SOCKET_URL = "http://localhost:8017";

export const useSocket = () => {
    const { user } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const s: Socket = io(SOCKET_URL, {
            withCredentials: true,
        });

        setSocket(s);

        s.on("connect", () => {
            console.log("Socket connected", s.id);

            if (user.roles?.includes("admin")) {
                // admin
                s.emit("register_admin");
                console.log("Emitted register_admin");
            } else {

                s.emit("register_user", user._id);
                console.log("Emitted register_user with", user._id);
            }
        });

        s.on("connect_error", (err) => {
            console.log("Socket connect_error:", err.message, err);
        });

        s.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        return () => {
            s.disconnect();
            setSocket(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return socket;
};
