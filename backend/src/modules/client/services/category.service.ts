import { Category } from "../../../models/categories.model";

export const categoryService = {
    async listCategories(options: { active?: boolean; tree?: boolean }) {
        const filter: any = {};
        if (options.active) {
            filter.is_active = true;
        }

        const categories = await Category.find(filter)
            .sort({ createdAt: 1 })
            .lean();

        if (!options.tree) {
            return categories;
        }

        // build tree
        const map = new Map<string, any>();
        categories.forEach((cat) => {
            const id = String(cat._id);
            map.set(id, { ...cat, category_id: id, children: [] as any[] });
        });

        const roots: any[] = [];

        map.forEach((cat) => {
            if (cat.parent_id) {
                const parent = map.get(String(cat.parent_id));
                if (parent) {
                    parent.children.push(cat);
                    return;
                }
            }
            roots.push(cat);
        });

        return roots;
    },
};