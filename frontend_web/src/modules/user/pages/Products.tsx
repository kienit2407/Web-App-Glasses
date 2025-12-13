import { useState, useMemo, useEffect, useRef } from "react";
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

const TYPE_CATEGORY_SLUGS: Record<ProductType, string[]> = {
  frame: ["gong-kinh", "gong-kinh-can"],
  sunglasses: ["kinh-mat"],
};

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

  // Lấy params từ URL
  const typeParam = (searchParams.get("type") as ProductType | null) || undefined;
  const genderParam = searchParams.get("gender") || undefined;
  const shapeParam = searchParams.get("shape") || undefined;
  const brandFromUrl = searchParams.get("brands");

  const [searchQuery, setSearchQuery] = useState("");
  // State filter
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  // const productTopRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter cố định (không cho user sửa ở UI)
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
  // useEffect(() => {
  //   // Chỉ cuộn khi danh sách thay đổi VÀ không phải là lần đầu tiên load trang
  //   if (listProduct.length > 0 && productTopRef.current) {
  //     productTopRef.current.scrollIntoView({
  //       behavior: "auto",
  //       block: "start"
  //     });
  //   }
  // }, [page, listProduct]); // Chỉ cuộn khi bấm chuyển trang (Page thay đổi)
  /** ============ HELPER ============ */
  const getCategoryIdsByType = (
    type: ProductType | undefined,
    cats: typeof listCategories
  ): string[] => {
    if (!type) return [];
    const slugs = TYPE_CATEGORY_SLUGS[type] ?? [];
    if (!slugs.length) return [];
    return cats
      .filter((c) => slugs.includes(c.slug))
      .map((c) => c._id);
  };
  useEffect(() => {
    // Cuộn lên đầu mỗi khi danh sách sản phẩm thay đổi (do lọc hoặc phân trang)
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, listProduct]); // Thêm các dependency này
  /** ============ 1. LOGIC ĐỒNG BỘ URL VÀO STATE ============ */
  // Effect này chỉ chạy khi URL hoặc Categories thay đổi
  // Nhiệm vụ: Set đúng state selectedBrands / selectedCategories để UI hiển thị checkbox xanh
  useEffect(() => {
    // Chỉ chạy logic mapping khi đã có Categories
    if (listCategories.length === 0) return;

    // --- Xử lý Category ---
    if (typeParam) {
      const ids = getCategoryIdsByType(typeParam, listCategories);
      setSelectedCategories(ids);
    } else {
      setSelectedCategories([]);
    }

    // --- Xử lý Brand (FIX QUAN TRỌNG) ---
    if (brandFromUrl) {
      // Nếu URL có brands=... -> set luôn vào state
      setSelectedBrands([brandFromUrl]);
    } else {
      setSelectedBrands([]);
    }

    // Lưu ý: Effect này KHÔNG gọi API fetch sản phẩm
    // Việc gọi API để cho Effect phía dưới lo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeParam, brandFromUrl, listCategories.length]); // Thêm listCategories.length để khi load xong nó map lại

  /** ============ 2. HÀM GỌI API (CENTRALIZED) ============ */
  const fetchWithFilters = (pageOverride?: number) => {
    // Logic: Ưu tiên state hiện tại
    let catIds = selectedCategories;

    // Fallback: Nếu chưa chọn category nhưng URL có type -> tự map
    // (Dành cho trường hợp mới vào trang, state chưa kịp cập nhật nhưng user cần xem ngay)
    if ((!catIds || catIds.length === 0) && typeParam && listCategories.length > 0) {
      catIds = getCategoryIdsByType(typeParam, listCategories);
    }

    let brandIds = selectedBrands;
    // Fallback: Tương tự, nếu state chưa kịp set mà URL có brand -> lấy từ URL
    if ((!brandIds || brandIds.length === 0) && brandFromUrl) {
      brandIds = [brandFromUrl];
    }

    getListQuery({
      q: searchQuery || undefined,
      categories: catIds.length ? catIds : undefined,
      brands: brandIds.length ? brandIds : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sortBy,
      page: pageOverride ?? 1,
      gender,
      shape,
      type: typeParam,
    });
  };

  /** ============ 3. EFFECT GỌI API KHI FILTER THAY ĐỔI ============ */
  useEffect(() => {
    // Load data nền tảng nếu chưa có
    if (!listCategories.length) {
      fetchCategories();
    }
    if (!listBrands.length) {
      fetchBrands();
    }

    // QUAN TRỌNG: Nếu chưa có category thì khoan hãy gọi API lọc sản phẩm 
    // (để tránh lọc sai logic Type)
    if (!listCategories.length) return;

    // Gọi API lọc sản phẩm
    fetchWithFilters(1);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Khi bất kỳ cái nào dưới đây thay đổi -> Gọi lại API
    sortBy,
    selectedCategories,
    selectedBrands,
    minPrice,
    maxPrice,
    listCategories.length, // <--- THÊM CÁI NÀY: Để khi load xong Categories nó tự gọi lại API lần nữa
    brandFromUrl // <--- THÊM CÁI NÀY: Để URL đổi thì gọi lại ngay
  ]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchWithFilters(newPage);
  };

  // ... (Giữ nguyên các hàm toggleCategory, toggleBrand, inferredTypeLabel, filterTitle như cũ)
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

  const inferredTypeLabel = useMemo(() => {
    if (!listCategories.length) {
      return typeParam ? TYPE_LABEL_MAP[typeParam] ?? typeParam : "";
    }
    const frameIds = getCategoryIdsByType("frame", listCategories);
    const sunglassIds = getCategoryIdsByType("sunglasses", listCategories);
    const cats = selectedCategories.length
      ? selectedCategories
      : getCategoryIdsByType(typeParam, listCategories);

    if (!cats || !cats.length) return "";
    const hasFrame = cats.some((id) => frameIds.includes(id));
    const hasSunglass = cats.some((id) => sunglassIds.includes(id));

    if (hasFrame && !hasSunglass) return "Gọng kính";
    if (!hasFrame && hasSunglass) return "Kính mát";
    if (hasFrame && hasSunglass) return "Tất cả sản phẩm";
    return "";
  }, [selectedCategories, listCategories, typeParam]);

  const filterTitleParts: string[] = [];
  if (inferredTypeLabel) filterTitleParts.push(inferredTypeLabel);
  if (genderParam) filterTitleParts.push(GENDER_LABEL_MAP[genderParam] ?? genderParam);
  if (shapeParam) filterTitleParts.push(SHAPE_LABEL_MAP[shapeParam] ?? shapeParam);
  const filterTitle = filterTitleParts.length > 0 ? filterTitleParts.join(" - ") : "";

  return (
    <div className="min-h-screen py-8">
      <div className="w-full max-w-screen-2xl mx-auto px-2">
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
                if (e.key === "Enter") fetchWithFilters(1);
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
          {/* Sidebar */}
          <aside className={`md:w-64 space-y-6 ${showFilters ? "block" : "hidden md:block"}`}>
            {/* Price */}
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

            {/* Categories */}
            <div className="space-y-3">
              <h3 className="font-semibold">Danh mục</h3>
              <div className="space-y-2">
                {listCategories.map((category) => (
                  <div key={category._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category._id}`}
                      checked={selectedCategories.includes(category._id)}
                      onCheckedChange={() => toggleCategory(category._id)}
                    />
                    <Label htmlFor={`category-${category._id}`} className="text-sm cursor-pointer">
                      {category.category_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Brands */}
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
                    <Label htmlFor={`brand-${brand._id}`} className="text-sm cursor-pointer">
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
                // Reset về trang 1, không filter
                getListQuery({ page: 1, sort: "newest" });
              }}
            >
              Xóa bộ lọc
            </Button>
          </aside>

          {/* Grid Products */}
          <div className="flex-1">
            {/* Thêm thẻ div rỗng này để làm điểm mốc cuộn tới */}
            {/* <div ref={productTopRef}  /> */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : listProduct.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listProduct.map((product) => (
                    <AnimatedProductCard key={product.product_id} product={product} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(page - 1); }}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const p = idx + 1;
                          return (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href="#"
                                isActive={p === page}
                                onClick={(e) => { e.preventDefault(); handlePageChange(p); }}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(page + 1); }}
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
                  {filterTitle && <><br /><span className="text-sm">(Bộ lọc: {filterTitle})</span></>}
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