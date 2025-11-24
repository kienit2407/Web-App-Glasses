"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLOSE_DB = exports.CONNECTDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_1 = require("./environment");
const CONNECTDB = async () => {
    if (!environment_1.env.MONGODB_LOCAL)
        throw new Error("Url is not Set");
    await mongoose_1.default.connect(environment_1.env.MONGODB_LOCAL, { dbName: environment_1.env.DATABASE_NAME });
};
exports.CONNECTDB = CONNECTDB;
const CLOSE_DB = async () => {
    await mongoose_1.default.connection.close();
};
exports.CLOSE_DB = CLOSE_DB;
