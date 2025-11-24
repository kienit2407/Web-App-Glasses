/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom"
import { ArrowRight, Shield, Truck, CreditCard, Star, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedProductCard } from "@/modules/user/components/AnimatedProductCard"
import { VideoHero } from "@/modules/user/components/VideoHero"
import { ProductShowcase } from "@/modules/user/components/ProductShowcase"
import { useEffect, useState } from "react"
import { API } from "@/app/lib/axios-client"
import { ProductListItem } from "@/types/product"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { useCatalog } from "@/hooks/use-catalog"
import { Carousel } from "antd"

const Home = () => {
  const [shopSettings, setShopSettings] = useState<any | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const {
    isLoading,
    listCategories,
    fetchCategories,
    featuredProducts,
    bestSellerProducts,
    fetchHomeProducts,
    listBrands,
    fetchBrands,
  } = useCatalog()
  useEffect(() => {
    fetchCategories()
    fetchHomeProducts()
    fetchBrands()
  }, [fetchHomeProducts, fetchCategories, fetchBrands])
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingSettings(true)
        const res = await API.get("/shop-settings")
        setShopSettings(res.data?.data || null)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingSettings(false)
      }
    }
    run()
  }, [])

  const banners: { _id: string; banner_url: string; position: number }[] =
    (shopSettings?.banner_list || []).sort(
      (a: any, b: any) => a.position - b.position
    )
  const mainFeatured = featuredProducts[0]
  const secondFeatured = featuredProducts[1]

  return (
    <div className="min-h-screen">
      {/* Video Hero Section */}
      <VideoHero />
      {loadingSettings ? (
        <div className="min-h-screen flex justify-center py-8">
          <Spinner />
        </div>
      ) : banners.length > 0 ? (
        <Carousel
          arrows
          draggable
          infinite
          autoplay
          autoplaySpeed={3000}
          dots={true}
          className="rounded-xl overflow-hidden px-4"
        >
          {banners.map((b) => (
            <div key={b._id} className="px-4 md:px-20">
              <div className="relative w-full rounded-xl overflow-hidden shadow-md">
                <img
                  src={b.banner_url}
                  alt="Banner"
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          ))}
        </Carousel>
      ) : (
        <></>
      )}
      {/* Features */}
      <section className="py-20 border-y border-border bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tại sao chọn <span className="text-gradient">VisionStore</span>?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4 group animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                Bảo hành 12 tháng
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cam kết chất lượng và bảo hành toàn diện cho mọi sản phẩm
              </p>
            </div>
            <div className="text-center space-y-4 group animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                <Truck className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="font-semibold text-lg group-hover:text-purple-500 transition-colors">
                Giao hàng nhanh
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Giao hàng nhanh chóng, toàn quốc
              </p>
            </div>
            <div className="text-center space-y-4 group animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="font-semibold text-lg group-hover:text-pink-500 transition-colors">
                Thanh toán đa dạng
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hỗ trợ COD, chuyển khoản, thẻ và ví điện tử
              </p>
            </div>
            <div className="text-center space-y-4 group animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 group-hover:scale-110 transition-transform duration-300">
                <Star className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
                Chính hãng 100%
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cam đoan hàng chính hãng, nhập khẩu trực tiếp
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase 1 */}
      {mainFeatured && (
        <ProductShowcase
          title={mainFeatured.product_name}
          imgSrc={mainFeatured.thumbnail_url}
          productId={mainFeatured.product_id} // dùng slug thật
          slug={mainFeatured.slug}
        />
      )}

      {/* Product Showcase 2 */}
      {secondFeatured && (
        <ProductShowcase
          title={secondFeatured.product_name}
          imgSrc={secondFeatured.thumbnail_url}
          productId={secondFeatured.product_id}
          slug={secondFeatured.slug}
          reverse
        />
      )}

      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                Thương hiệu chính hãng
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Thương hiệu nổi bật
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Chọn thương hiệu bạn yêu thích để xem toàn bộ bộ sưu tập sản phẩm
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {listBrands.map((brand, index) => (
              <Link
                key={brand._id}
                to={`/products?brands=${encodeURIComponent(brand._id)}`}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-muted/60 hover:bg-background hover:shadow-elegant transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Logo */}
                {brand.logo_url ? (
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-md">
                    <img
                      src={brand.logo_url}
                      alt={brand.brand_name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-xl font-bold text-primary">
                    {brand.brand_name?.[0]?.toUpperCase() ?? "B"}
                  </div>
                )}

                {/* Tên brand */}
                <span className="font-semibold text-sm text-center group-hover:text-primary transition-colors">
                  {brand.brand_name}
                </span>

                {/* CTA nhỏ */}
                <span className="text-[11px] text-muted-foreground group-hover:text-primary/80 flex items-center gap-1">
                  Xem sản phẩm
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured / Best Seller Products */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-accent animate-pulse fill-accent" />
              <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                Bán chạy nhất
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Sản phẩm nổi bật
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Những mẫu kính được yêu thích và đánh giá cao nhất tháng này
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestSellerProducts.map((product, index) => (
                  <AnimatedProductCard
                    key={product.product_id}
                    product={product}
                  />
                ))}
              </div>
              <div
                className="text-center mt-16 animate-fade-in-up"
                style={{ animationDelay: "0.8s" }}
              >
                <Link to="/products">
                  <Button variant="hero" size="lg" className="group shadow-elegant">
                    Xem tất cả sản phẩm
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
