import { Link } from "react-router-dom";
import { Glasses, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { useShopSettingsStore } from "@/hooks/use-setting";
import { Image } from "antd";
import { useCatalog } from "@/hooks/use-catalog";
import { useEffect } from "react";

export const Footer = () => {
  const { settings } = useShopSettingsStore();
  const { isLoading, fetchCategories, listCategories, fetchBrands, listBrands } = useCatalog()
  console.log(settings)
  useEffect(() => {
    fetchCategories()
    fetchBrands()
  }, [fetchCategories, fetchBrands])

  
  return (
    <footer className="border-t border-blue-700 border-border bg-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {settings?.shop_logo_url ? (
                <img
                  className="w-20 h-auto"
                  src={settings.shop_logo_url}
                />) : (
                <Glasses className="h-6 w-6 text-primary" />
              )}
              <span className="font-bold text-xl text-gradient">{settings?.shop_name || "Tên cửa hàng"}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cửa hàng kính uy tín với hơn 10 năm kinh nghiệm.
              Cam kết chất lượng và dịch vụ tốt nhất.
            </p>
            <div className="flex gap-3">
              <a href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-lg mb-4">PHƯƠNG THỨC VẬN CHUYỂN</h3>
              <div className="flex items-center">
                <img
                  className="w-[140px] mr-2"
                  src="/logo.jpg"
                />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">THANH TOÁN</h3>
              <div className="flex items-center">
                <img
                  className="w-[140px] mr-2"
                  src="/logo_vnpay.jpg"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">DANH MỤC</h3>
            <div className="flex flex-col gap-1">
              {listCategories.map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${encodeURIComponent(category._id)}`}
                  className="hover:text-cyan-700 text-sm"
                >
                  <div className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {category.category_name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          {/* Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">NHÃN HIỆU</h3>
            <div className="flex flex-col gap-1">
              {listBrands.map((brand) => (
                <Link
                  key={brand._id}
                  to={`/products?category=${encodeURIComponent(brand._id)}`}
                  className="hover:text-cyan-700 text-sm"
                >
                  <div className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {brand.brand_name}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">LIÊN HỆ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                {settings?.shipping_origin ? (
                  <span>
                    {settings.shipping_origin.ward_name}, {settings.shipping_origin.district_name}, {settings.shipping_origin.province_name}
                  </span>
                ) : ('Chưa được cấu hình')}

              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span>{settings?.shop_phone || "Chưa được cấu hình"}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>{settings?.shop_email || "Email"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; 2025 {settings?.shop_name || "Tên cửa hàng"}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
