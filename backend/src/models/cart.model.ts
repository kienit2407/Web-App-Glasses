import { Schema, model, Types, Document } from "mongoose"
export interface ICart extends Document {
    user_id: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

export const Cart = model<ICart>('carts', new Schema<ICart>({
    user_id: { type: Schema.Types.ObjectId, ref: "users", required: true, unique: true, index: true }
}))