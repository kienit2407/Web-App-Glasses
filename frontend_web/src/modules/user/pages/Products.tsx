// src/pages/Products.tsx
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { AnimatedProductCard } from "../components/AnimatedProductCard";
import { useCatalog } from "@/hooks/use-catalog";

/** ================== TYPE & MAPPING ================== */

type ProductType = "frame" | "sunglasses";


// Ví dụ: nếu category "Gọng kính" slug = "gong-kinh", "Kính mát" slug = "kinh-mat"
const TYPE_CATEGORY_SLUGS: Record<ProductType, string[]> = {
  frame: ["gong-kinh", "gong-kinh-can"], // <-- chỉnh lại cho đúng
  sunglasses: ["kinh-mat"],             // <-- chỉnh lại cho đúng
};

// --- mapping để hiển thị tiêu đề bộ lọc ---
const TYPE_LABEL_MAP: Record<string, string> = {
  frame: "Gọng kính",
  sunglasses: "Kính mát",
};

const GENDER_LABEL_MAP: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  unisex: "Unisex",
  kids: "Trẻ em",
};

const SHAPE_LABEL_MAP: Record<string, string> = {
  square: "Vuông",
  rectangle: "Chữ nhật",
  round: "Tròn",
  browline: "Browline",
  oval: "Oval",
  polygon: "Đa giác",
  "cat-eye": "Mắt mèo",
  pilot: "Phi công",
  sport: "Thể thao",
};

const Products = () => {
  const [searchParams] = useSearchParams();

  const typeParam = (searchParams.get("type") as ProductType | null) || undefined;
  const genderParam = searchParams.get("gender") || undefined;
  const shapeParam = searchParams.get("shape") || undefined;
  const brandFromUrl = searchParams.get("brands");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // các filter cố định theo URL (không cho user đổi ở sidebar)
  const gender = genderParam || undefined;
  const shape = shapeParam || undefined;

  const {
    isLoading,
    listProduct,
    page,
    limit,
    total,
    getListQuery,
    listCategories,
    fetchCategories,
    listBrands,
    fetchBrands,
  } = useCatalog();

  const totalPages = useMemo(
    () => (limit > 0 ? Math.ceil(total / limit) : 1),
    [total, limit]
  );

  /** ============ HELPER: map type -> categoryIds ============ */

  const getCategoryIdsByType = (
    type: ProductType | undefined,
    cats: typeof listCategories
  ): string[] => {
    if (!type) return [];
    const slugs = TYPE_CATEGORY_SLUGS[type] ?? [];
    if (!slugs.length) return [];
    return cats
      .filter((c) => slugs.includes(c.slug))
      .map((c) => c._id); // hoặc c.category_id nếu BE dùng trường đó
  };

  /** ============ HÀM DÙNG CHUNG GỌI API ============ */

  const fetchWithFilters = (
    pageOverride?: number,
    categoriesOverride?: string[],
    brandsOverride?: string[]
  ) => {
    // luôn dùng listCategories hiện tại
    const catsAll = listCategories;

    let catIds =
      categoriesOverride ??
      (selectedCategories.length ? selectedCategories : undefined);

    // 👉 Nếu chưa có category nào được chọn, nhưng có typeParam
    //    => map type -> categoryIds
    if ((!catIds || catIds.length === 0) && typeParam) {
      const fromType = getCategoryIdsByType(typeParam, catsAll);
      if (fromType.length) {
        catIds = fromType;
      }
    }

    const brandIds =
      brandsOverride ??
      (selectedBrands.length ? selectedBrands : undefined);

    getListQuery({
      q: searchQuery || undefined,
      categories: catIds,
      brands: brandIds,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sortBy,
      page: pageOverride ?? 1,
      gender,
      shape,
      type: typeParam,
    });
  };

  /** ============ INIT + KHI URL type / gender / shape / brand THAY ĐỔI ============ */

  useEffect(() => {
    const init = async () => {
      const cats =
        listCategories.length > 0 ? listCategories : await fetchCategories();

      // ---- xử lý typeParam -> selectedCategories ban đầu ----
      if (typeParam) {
        const initialCategoryIds = getCategoryIdsByType(typeParam, cats);
        setSelectedCategories(initialCategoryIds);
      } else {
        setSelectedCategories([]);
      }

      // ---- xử lý brandFromUrl -> selectedBrands ban đầu ----
      if (brandFromUrl) {
        setSelectedBrands([brandFromUrl]);
      } else {
        setSelectedBrands([]);
      }

      // gọi API lần đầu với type + gender + shape + brand
      fetchWithFilters(1);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeParam, gender, shape, brandFromUrl]);

  /** ============ KHI ĐỔI FILTER Ở SIDEBAR (GIÁ, CATEGORY, BRAND, SORT) ============ */

  useEffect(() => {
    if (!listCategories.length) return; // tránh gọi trước khi có categories
    fetchWithFilters(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, selectedCategories, selectedBrands, minPrice, maxPrice]);

  /** ============ LOAD BRANDS ============ */

  useEffect(() => {
    if (!listBrands.length) {
      fetchBrands();
    }
  }, [listBrands.length, fetchBrands]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchWithFilters(newPage);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    );
  };

  /** ============ TITLE: tự suy ra Gọng kính / Kính mát / Tất cả ============ */

  const inferredTypeLabel = useMemo(() => {
    if (!listCategories.length) {
      // chưa có data, fallback dùng typeParam
      return typeParam ? TYPE_LABEL_MAP[typeParam] ?? typeParam : "";
    }

    const frameIds = getCategoryIdsByType("frame", listCategories);
    const sunglassIds = getCategoryIdsByType("sunglasses", listCategories);

    const cats = selectedCategories.length
      ? selectedCategories
      : getCategoryIdsByType(typeParam, listCategories);

    if (!cats || !cats.length) {
      return "";
    }

    const hasFrame = cats.some((id) => frameIds.includes(id));
    const hasSunglass = cats.some((id) => sunglassIds.includes(id));

    if (hasFrame && !hasSunglass) return "Gọng kính";
    if (!hasFrame && hasSunglass) return "Kính mát";
    if (hasFrame && hasSunglass) return "Tất cả sản phẩm";

    return "";
  }, [selectedCategories, listCategories, typeParam]);

  // ====== TIÊU ĐỀ BỘ LỌC (Gọng kính · Nam · Chữ nhật) ======
  const filterTitleParts: string[] = [];

  if (inferredTypeLabel) {
    filterTitleParts.push(inferredTypeLabel);
  }
  if (genderParam) {
    filterTitleParts.push(GENDER_LABEL_MAP[genderParam] ?? genderParam);
  }
  if (shapeParam) {
    filterTitleParts.push(SHAPE_LABEL_MAP[shapeParam] ?? shapeParam);
  }

  const filterTitle =
    filterTitleParts.length > 0 ? filterTitleParts.join(" - ") : "";

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Sản phẩm</h1>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchWithFilters(1);
                }
              }}
              className="w-full"
            />
            <p className="text-muted-foreground text-xl mt-5">
              Tìm thấy {total} sản phẩm
            </p>

            {filterTitle && (
              <p className="text-[14px] text-muted-foreground mt-1">
                Bộ lọc:&nbsp;
                <span className="text-primary text-xl font-bold">
                  {filterTitle}
                </span>
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="h-4 w-4 mr-2" />
            Bộ lọc
          </Button>
          <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="price_asc">Giá tăng dần</SelectItem>
              <SelectItem value="price_desc">Giá giảm dần</SelectItem>
              <SelectItem value="rating">Đánh giá cao</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`md:w-64 space-y-6 ${
              showFilters ? "block" : "hidden md:block"
            }`}
          >
            {/* Price Filter */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Khoảng giá
              </h3>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Giá tối thiểu"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Giá tối đa"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <h3 className="font-semibold">Danh mục</h3>
              <div className="space-y-2">
                {listCategories.map((category) => (
                  <div
                    key={category._id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`category-${category._id}`}
                      checked={selectedCategories.includes(category._id)}
                      onCheckedChange={() => toggleCategory(category._id)}
                    />
                    <Label
                      htmlFor={`category-${category._id}`}
                      className="text-sm cursor-pointer"
                    >
                      {category.category_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-3">
              <h3 className="font-semibold">Thương hiệu</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {listBrands.map((brand) => (
                  <div key={brand._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand._id}`}
                      checked={selectedBrands.includes(brand._id)}
                      onCheckedChange={() => toggleBrand(brand._id)}
                    />
                    <Label
                      htmlFor={`brand-${brand._id}`}
                      className="text-sm cursor-pointer"
                    >
                      {brand.brand_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategories([]);
                setSelectedBrands([]);
                setMinPrice("");
                setMaxPrice("");
                setSortBy("newest");
                fetchWithFilters(1, []);
              }}
            >
              Xóa bộ lọc
            </Button>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : listProduct.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listProduct.map((product) => (
                    <AnimatedProductCard
                      key={product.product_id}
                      product={product}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page - 1);
                            }}
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const p = idx + 1;
                          return (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href="#"
                                isActive={p === page}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handlePageChange(p);
                                }}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page + 1);
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  Không tìm thấy sản phẩm phù hợp
                  {filterTitle && (
                    <>
                      <br />
                      <span className="text-sm">(Bộ lọc: {filterTitle})</span>
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
