import { Schema, model, Document } from "mongoose"

export interface IWard extends Document {
    code: string             // mã nội bộ cho FE + address (thường chính là WardCode)
    name: string
    district_code: string    // link về District.code

    ghn_id: string           // WardCode GHN
    is_active: boolean
    createdAt: Date
    updatedAt: Date
}

export const Ward = model<IWard>('wards', new Schema<IWard>(
    {
        code: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },

        district_code: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },

        ghn_id: { type: String, required: true, unique: true, index: true },

        is_active: { type: Boolean, default: true, index: true },
    },
    { timestamps: true }
))