import { cloudinaryClient } from "../config/cloudinary";

export const uploadImageBuffer = (buffer: Buffer, folder: string) => {
    return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinaryClient.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error || !result) return reject(error);
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        );
        stream.end(buffer);
    });
};