import { Schema, model, Document } from "mongoose"

export interface IProvince extends Document {
    code: string
    name: string
    ghn_id: number
    is_active: boolean
    createdAt: Date
    updatedAt: Date
}
export const Province = model<IProvince>('provinces', new Schema<IProvince>(
    {
        code: { type: String, required: true, unique: true, trim: true},
        name: { type: String, required: true, trim: true },

        // mapping sang GHN
        ghn_id: { type: Number, required: true, unique: true, index: true },

        is_active: { type: Boolean, default: true, index: true },
    },
    { timestamps: true }
))