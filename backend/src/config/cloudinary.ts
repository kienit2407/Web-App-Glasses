import { v2 as cloudinary } from 'cloudinary'
import { env } from './environment'


cloudinary.config({
    cloud_name: env.CLOUDINARY_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
})
export const cloudinaryClient = cloudinary
export interface UploadedMeta {
    url: string;
    url_id: string;
}

export function uploadToCloud(
    file: Express.Multer.File,
    folder: string
): Promise<UploadedMeta> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "auto", // ảnh + video đều ok
            },
            (error, result) => {
                if (error || !result) return reject(error);

                resolve({
                    url: result.secure_url,
                    url_id: result.public_id,
                });
            }
        );

        // vì dùng memoryStorage nên buffer có sẵn
        stream.end(file.buffer);
    });
}




