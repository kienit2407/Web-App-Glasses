
import { Brand } from "../../../models/brands.model";

export const brandService = {
    async listBrands(options: { active?: boolean }) {
        const filter: any = {};
        if (options.active) {
            filter.is_active = true;
        }

        const brands = await Brand.find(filter)
            .sort({ brand_name: 1 })
            .lean();

        return brands;
    },
};
