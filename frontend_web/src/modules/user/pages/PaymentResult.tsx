import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button, Divider, Result, Spin } from "antd";
import { ArrowRight, Star } from "lucide-react";
import { useCatalog } from "@/hooks/use-catalog";
import { useEffect } from "react";
import { AnimatedProductCard } from "../components/AnimatedProductCard";

const PaymentResult = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const status = params.get("vnp_status"); // success | failed | error
    const orderId = params.get("order_id");
    const msg = params.get("msg");
    const method = params.get("method") || "vnpay"; // cod | vnpay | default vnpay
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

        fetchHomeProducts()
    }, [fetchHomeProducts])
    const goHome = () => navigate("/");
    const goOrderDetail = () => {
        if (orderId) navigate(`/orders/${orderId}`);
    };
    let resultComponent;
    if (status === "success") {
        const title =
            method === "cod"
                ? "Đặt hàng thành công!"
                : "Thanh toán VNPay thành công!";

        resultComponent = (
            <Result
                status="success"
                title={title}
                subTitle={orderId ? `Mã đơn hàng: ${orderId}` : undefined}
                extra={[
                    orderId && (
                        <Button
                            type="primary"
                            key="detail"
                            onClick={goOrderDetail}
                        >
                            Xem chi tiết đơn hàng
                        </Button>
                    ),
                    <Button key="home" onClick={goHome}>
                        Về trang chủ
                    </Button>,
                ]}
            />
        );
    } else if (status === "failed") {
        resultComponent = (
            <Result
                status="error"
                title="Thanh toán thất bại"
                subTitle={
                    orderId
                        ? `Mã đơn hàng: ${orderId}. Bạn có thể kiểm tra lại hoặc thử phương thức khác.`
                        : "Thanh toán thất bại, vui lòng kiểm tra lại đơn hàng của bạn."
                }
                extra={[
                    orderId && (
                        <Button
                            type="primary"
                            key="detail"
                            onClick={goOrderDetail}
                        >
                            Xem chi tiết đơn hàng
                        </Button>
                    ),
                    <Button key="home" onClick={goHome}>
                        Về trang chủ
                    </Button>,
                
                ]}
            />
        );
    } else {
        // Trường hợp error / không có status rõ ràng
        resultComponent = (
            <Result
                status="warning"
                title="Không xác định được kết quả thanh toán"
                subTitle={msg || "Vui lòng kiểm tra lại lịch sử đơn hàng của bạn."}
                extra={[
                    orderId && (
                        <Button
                            type="primary"
                            key="detail"
                            onClick={goOrderDetail}
                        >
                            Xem chi tiết đơn hàng
                        </Button>
                    ),
                    <Button key="home" onClick={goHome}>
                        Về trang chủ
                    </Button>

                ]}
            />
        );
    }

    // --- Phần JSX của Best Seller (Phải đảm bảo các import và định nghĩa liên quan đã có) ---
    const bestSellerSection = (
        <section className="py-20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 mb-4">
                        {/* Star component */}
                        <Star className="h-6 w-6 text-accent animate-pulse fill-accent" />
                        <span className="text-sm font-semibold text-accent uppercase tracking-wider">
                            Bán chạy nhất
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Sản phẩm bạn có thể thích
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Những mẫu kính được yêu thích và đánh giá cao nhất tháng này
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        {/* Spinner component */}
                        <Spin />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {bestSellerProducts.map((product) => (
                                // AnimatedProductCard component
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
                            {/* Link component */}
                            <Link to="/products">
                                {/* CustomButton component */}
                                <Button variant="filled" className="group shadow-elegant">
                                    Xem tất cả sản phẩm
                                    {/* ArrowRight component */}
                                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </section>
    );

    // Trả về cả kết quả thanh toán VÀ phần Best Seller
    return (
        <>

            {resultComponent}
            <Divider/>
            {bestSellerSection}
        </>
    );
};

export default PaymentResult;
