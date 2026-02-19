import { Schema, model, Types, Document } from "mongoose"
type ImageProvider = {
    url: String,
    url_id: String, // public_id của cloudinary (hoặc tương đương)
}
type AdminReply = {
    content: string;
    admin_id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    is_edited: boolean;
};
export interface IReview extends Document {
    user_id: Types.ObjectId;
    product_id: Types.ObjectId;
    rating: number;
    images: ImageProvider[];
    comment: string;
    video_url: string | null;
    is_edited: boolean;

    admin_reply?: AdminReply | null;

    createdAt: Date;
    updatedAt: Date;
}
const AdminReplySchema = new Schema<AdminReply>(
    {
        content: { type: String, trim: true, required: true },
        // NOTE: nếu admin cũng nằm trong "users" thì ref: "users"
        // nếu có collection riêng thì đổi ref phù hợp (vd: "admins")
        admin_id: { type: Schema.Types.ObjectId, ref: "users", required: true },
        is_edited: { type: Boolean, default: false },
    },
    { timestamps: true, _id: false }
);

export const Review = model<IReview>('reviews', new Schema<IReview>({
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
    product_id: { type: Schema.Types.ObjectId, ref: "products", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    images: [
        {
            url: String,
            url_id: String, // public_id của cloudinary (hoặc tương đương)
        },
    ],
    comment: { type: String, required: true, trim: true },
    video_url: { type: String, default: null },
    is_edited: { type: Boolean, default: false },
    admin_reply: { type: AdminReplySchema, default: null },
}, { timestamps: true }).index(
    {
        user_id: 1,
        product_id: 1
    },
    { unique: true } // mỗi user chỉ được đánh giá 1 sản phẩm
))