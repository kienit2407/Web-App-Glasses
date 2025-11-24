"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//==============Dependencies=====================
const express_1 = __importDefault(require("express"));
const environment_1 = require("./config/environment");
const index_1 = require("./routes/index");
const errol_handling_middleware_1 = require("./middleware/errol_handling_middleware");
const mongoosedb_1 = require("./config/mongoosedb");
const cors_1 = __importDefault(require("cors"));
const async_exit_hook_1 = __importDefault(require("async-exit-hook"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const redis_1 = require("./config/redis");
const http_1 = __importDefault(require("http"));
const morgan_1 = __importDefault(require("morgan"));
const socket_io_1 = require("./config/socket.io");
//===================================
const app = (0, express_1.default)();
const port = parseInt(environment_1.env.APP_PORT) ?? 3000;
const hostname = environment_1.env.APP_HOST;
const START_SERVER = () => {
    // Chỉ tạo 1 server duy nhất
    const server = http_1.default.createServer(app);
    // Gắn socket.io vào chính server này
    (0, socket_io_1.INITIALIZE_SOCKET_IO)(server);
    // Middlewares
    app.use(express_1.default.json({ limit: "4mb" }));
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, morgan_1.default)('dev'));
    app.use((0, cors_1.default)({
        origin: [
            'http://localhost:5173',
            'http://localhost:8017',
            'http://localhost:8080',
            'https://localhost:5173',
            'https://vision-api-dev.onrender.com',
        ],
        allowedHeaders: ["Content-Type", "Authorization", "x-client-platform"],
        credentials: true,
    }));
    app.use('/', index_1.API_ENTRYPOINT);
    app.use(errol_handling_middleware_1.errolHandlingMiddleware);
    // Listen bằng chính server đã gắn Socket.IO
    server.listen(port, () => {
        console.log(`Server running at http://${hostname}:${port}`);
    });
    (0, async_exit_hook_1.default)(() => {
        server.close(async () => {
            console.log('\nHTTP server closed.');
            try {
                console.log("6. DISCONNECTING TO MONGODB....");
                (0, mongoosedb_1.CLOSE_DB)();
                console.log("7. DISCONECTTED TO MONGDB");
                (0, redis_1.CLOSE_REDIS)();
                console.log("8. DISCONECTTED REDIS");
            }
            catch (err) {
                console.error('Error during DB disconnect:', err);
                process.exit(0);
            }
        });
    });
};
(async () => {
    try {
        console.log("1. CONNECTING TO MONGODB....");
        await (0, mongoosedb_1.CONNECTDB)();
        console.log("2. CONECTTED TO MONGDB");
        console.log("3. CONNECTING TO REDIS....");
        await (0, redis_1.CONNECT_REDIS)();
        console.log("4. CONECTTED TO REDIS");
        START_SERVER();
        console.log("5. SERVER STARTED");
    }
    catch (error) {
        console.log("CONECTTED TO MONGDB occured a Error");
        console.error(error);
        process.exit(0);
    }
})();
