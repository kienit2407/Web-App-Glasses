"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageBuffer = void 0;
const cloudinary_1 = require("../config/cloudinary");
const uploadImageBuffer = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.cloudinaryClient.uploader.upload_stream({ folder, resource_type: "image" }, (error, result) => {
            if (error || !result)
                return reject(error);
            resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
            });
        });
        stream.end(buffer);
    });
};
exports.uploadImageBuffer = uploadImageBuffer;
