"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
// src/services/auth.service.ts
const axios_client_1 = require("@app/lib/axios-client");
const use_auth_1 = require("@app/auth/use-auth");
exports.authService = {
    signUp: async (payload) => {
        const res = await axios_client_1.API.post('/auth/signup', payload);
        const tokens = res.data?.data?.tokens;
        const accessToken = tokens?.accessToken ?? null;
        if (accessToken) {
            const auth = use_auth_1.useAuth.getState();
            auth.setUser(auth.user, accessToken);
        }
        return res.data;
    },
    signIn: async (payload) => {
        const res = await axios_client_1.API.post('/auth/signin', payload);
        const tokens = res.data?.data?.tokens;
        const accessToken = tokens?.accessToken ?? null;
        if (accessToken) {
            const auth = use_auth_1.useAuth.getState();
            auth.setUser(auth.user, accessToken);
        }
        return res.data;
    },
    fetchMe: async () => {
        const res = await axios_client_1.API.get('/users/me');
        const user = res.data?.data;
        const auth = use_auth_1.useAuth.getState();
        auth.setUser(user, auth.accessToken);
        return user;
    },
    logout: async () => {
        try {
            await axios_client_1.API.post('/auth/logout');
        }
        catch {
            // ignore, vẫn clear local state
        }
        use_auth_1.useAuth.getState().logout();
    }
};
