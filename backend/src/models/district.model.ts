import { Schema, model, Document } from "mongoose";

export interface IDistrict extends Document {
    code: string;            // mã nội bộ cho FE + address (vd: DistrictID.toString())
    name: string;
    province_code: string;   

    ghn_id: number;          // DistrictID GHN
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const District = model<IDistrict>('districts', new Schema<IDistrict>(
    {
        code: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },

        province_code: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },

        ghn_id: { type: Number, required: true, unique: true, index: true },

        is_active: { type: Boolean, default: true, index: true },
    },
    { timestamps: true }
))