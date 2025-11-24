"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryClient = void 0;
exports.uploadToCloud = uploadToCloud;
const cloudinary_1 = require("cloudinary");
const environment_1 = require("./environment");
cloudinary_1.v2.config({
    cloud_name: environment_1.env.CLOUDINARY_NAME,
    api_key: environment_1.env.CLOUDINARY_API_KEY,
    api_secret: environment_1.env.CLOUDINARY_API_SECRET
});
exports.cloudinaryClient = cloudinary_1.v2;
function uploadToCloud(file, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "auto", // ảnh + video đều ok
        }, (error, result) => {
            if (error || !result)
                return reject(error);
            resolve({
                url: result.secure_url,
                url_id: result.public_id,
            });
        });
        // vì dùng memoryStorage nên buffer có sẵn
        stream.end(file.buffer);
    });
}
