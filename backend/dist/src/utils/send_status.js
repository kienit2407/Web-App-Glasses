"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAsFailure = exports.sendAsSuccess = void 0;
const sendAsSuccess = (res, status, data = null, mgs) => {
    return res.status(status).json({
        status,
        mgs: "Success",
        success: true,
        data: data
    });
};
exports.sendAsSuccess = sendAsSuccess;
const sendAsFailure = (res, status, mgs) => {
    return res.status(status).json({
        status,
        mgs: mgs ?? "Failure !",
        success: false,
    });
};
exports.sendAsFailure = sendAsFailure;
