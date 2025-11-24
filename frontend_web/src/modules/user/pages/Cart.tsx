// src/pages/Cart.tsx
import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useCart } from "@/hooks/use-cart";
import { Checkbox } from "antd";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

const Cart = () => {
  const navigate = useNavigate();
  const {
    cart,
    isLoading,
    isUpdating,
    fetchCart,
    updateItemQuantity,
    removeItem,
    selectedItemIds,
    toggleSelectItem,
    toggleSelectAll,
  } = useCart();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const {
    selectedItems,
    selectedOriginalAmount,
    selectedAmount,
    selectedDiscountAmount,
  } = useMemo(() => {
    if (!cart) {
      return {
        selectedItems: [],
        selectedOriginalAmount: 0,
        selectedAmount: 0,
        selectedDiscountAmount: 0,
      };
    }
    const items = cart.items.filter((i) => selectedItemIds.includes(i.item_id));
    const original = items.reduce(
      (sum, i) => sum + i.original_subtotal,
      0
    );
    const amount = items.reduce((sum, i) => sum + i.subtotal, 0);

    return {
      selectedItems: items,
      selectedOriginalAmount: original,
      selectedAmount: amount,
      selectedDiscountAmount: original - amount,
    };
  }, [cart, selectedItemIds]);

  if (isLoading && !cart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-6">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground" />
            <h1 className="text-3xl font-bold">Giỏ hàng trống</h1>
            <p className="text-muted-foreground">
              Bạn chưa có sản phẩm nào trong giỏ hàng
            </p>
            <Link to="/products">
              <Button size="lg">Khám phá sản phẩm</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allSelected =
    cart.items.length > 0 &&
    selectedItemIds.length === cart.items.length;

  const isIndeterminate =
    selectedItemIds.length > 0 && !allSelected;

  const handleIncrease = (itemId: string, currentQty: number) => {
    updateItemQuantity(itemId, currentQty + 1);
  };

  const handleDecrease = (itemId: string, currentQty: number) => {
    if (currentQty <= 1) return;
    updateItemQuantity(itemId, currentQty - 1);
  };

  const handleCheckout = () => {
    if (selectedItemIds.length === 0) return;
    navigate("/checkout", { state: { cartItemIds: selectedItemIds } });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-2 md:px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">
          Giỏ hàng của bạn
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: CART ITEMS */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-0 overflow-hidden">
              {/* Header dạng bảng – chỉ hiện trên md+ */}
              <div className="hidden md:grid grid-cols-[48px,minmax(0,2.5fr),minmax(0,1fr),120px,130px,90px] items-center px-4 py-3 bg-muted text-xs md:text-sm font-semibold text-muted-foreground">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={isIndeterminate}
                    onChange={() => toggleSelectAll()}
                  />
                </div>
                <span>Sản phẩm</span>
                <span className="text-center">Đơn giá</span>
                <span className="text-center">Số lượng</span>
                <span className="text-right">Số tiền</span>
                <span className="text-center">Thao tác</span>
              </div>

              {cart.items.map((item) => (
                <div key={item.item_id} className="border-t">
                  {/* DESKTOP ROW */}
                  <div className="hidden md:grid grid-cols-[48px,minmax(0,2.5fr),minmax(0,1fr),120px,130px,90px] items-center px-4 py-4 text-xs md:text-sm bg-background">
                    {/* Checkbox */}
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selectedItemIds.includes(item.item_id)}
                        onChange={() => toggleSelectItem(item.item_id)}
                      />
                    </div>

                    {/* Sản phẩm */}
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/products/${item.product_id}`}
                        className="shrink-0"
                      >
                        <img
                          src={item.thumbnail_url || "/placeholder.png"}
                          alt={item.product_name}
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md border"
                        />
                      </Link>
                      <div className="space-y-1 min-w-0">
                        <Link to={`/products/${item.product_id}`}>
                          <h3 className="font-medium hover:text-primary transition-colors line-clamp-2">
                            {item.product_name}
                          </h3>
                        </Link>
                        <p className="text-[11px] md:text-xs text-muted-foreground">
                          {item.frame_shape && `${item.frame_shape} • `}
                          {item.frame_color}
                        </p>
                      </div>
                    </div>

                    {/* Đơn giá */}
                    <div className="flex flex-col items-center justify-center gap-1">
                      {item.has_discount ? (
                        <>
                          <span className="line-through text-muted-foreground text-[11px] md:text-xs">
                            {formatPrice(item.original_unit_price)}
                          </span>
                          <span className="font-semibold text-primary">
                            {formatPrice(item.unit_price)}
                          </span>
                          {item.discount_percent > 0 && (
                            <span className="text-[11px] text-red-500 font-semibold">
                              -{item.discount_percent}%
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-semibold text-primary">
                          {formatPrice(item.unit_price)}
                        </span>
                      )}
                    </div>

                    {/* Số lượng */}
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                          className="px-2 md:px-3 py-1 hover:bg-muted transition-colors disabled:opacity-50"
                          onClick={() =>
                            handleDecrease(item.item_id, item.quantity)
                          }
                          disabled={isUpdating || item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                        <span className="px-3 py-1 md:px-4 text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          className="px-2 md:px-3 py-1 hover:bg-muted transition-colors disabled:opacity-50"
                          onClick={() =>
                            handleIncrease(item.item_id, item.quantity)
                          }
                          disabled={isUpdating}
                        >
                          <Plus className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Số tiền */}
                    <div className="flex flex-col items-end justify-center gap-1">
                      <span className="font-bold text-sm md:text-base text-primary">
                        {formatPrice(item.subtotal)}
                      </span>
                      {item.discount_amount > 0 && (
                        <span className="text-[11px] text-green-600">
                          Tiết kiệm{" "}
                          <strong>{formatPrice(item.discount_amount)}</strong>
                        </span>
                      )}
                    </div>

                    {/* Thao tác */}
                    <div className="flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.item_id)}
                        disabled={isUpdating}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* MOBILE CARD */}
                  <div className="flex md:hidden gap-3 px-3 py-3 bg-background">
                    {/* cột checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedItemIds.includes(item.item_id)}
                        onChange={() => toggleSelectItem(item.item_id)}
                      />
                    </div>

                    {/* nội dung còn lại */}
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-3">
                        <Link
                          to={`/products/${item.product_id}`}
                          className="shrink-0"
                        >
                          <img
                            src={item.thumbnail_url || "/placeholder.png"}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/products/${item.product_id}`}>
                            <h3 className="font-medium text-sm hover:text-primary transition-colors line-clamp-2">
                              {item.product_name}
                            </h3>
                          </Link>
                          <p className="text-[11px] text-muted-foreground">
                            {item.frame_shape && `${item.frame_shape} • `}
                            {item.frame_color}
                          </p>

                          {/* giá 1 cái hiển thị ngang */}
                          <div className="mt-1 flex items-baseline gap-2">
                            {item.has_discount ? (
                              <>
                                <span className="line-through text-[11px] text-muted-foreground">
                                  {formatPrice(item.original_unit_price)}
                                </span>
                                <span className="text-sm font-semibold text-primary">
                                  {formatPrice(item.unit_price)}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-primary">
                                {formatPrice(item.unit_price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* dưới: quantity + subtotal + delete */}
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center border border-border rounded-lg overflow-hidden">
                          <button
                            className="px-2 py-1 hover:bg-muted transition-colors disabled:opacity-50"
                            onClick={() =>
                              handleDecrease(item.item_id, item.quantity)
                            }
                            disabled={isUpdating || item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 py-1 text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            className="px-2 py-1 hover:bg-muted transition-colors disabled:opacity-50"
                            onClick={() =>
                              handleIncrease(item.item_id, item.quantity)
                            }
                            disabled={isUpdating}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            Thành tiền
                          </div>
                          <div className="text-sm font-bold text-primary">
                            {formatPrice(item.subtotal)}
                          </div>
                          {item.discount_amount > 0 && (
                            <div className="text-[11px] text-green-600">
                              Tiết kiệm{" "}
                              <strong>
                                {formatPrice(item.discount_amount)}
                              </strong>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.item_id)}
                          disabled={isUpdating}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-1">
            <Card className="p-6 space-y-6 sticky top-20">
              <h2 className="text-xl font-bold">Tóm tắt giỏ hàng</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Tạm tính ({selectedItems.length} sản phẩm):
                  </span>
                  <span className="font-medium">
                    {formatPrice(selectedOriginalAmount)}
                  </span>
                </div>

                {selectedDiscountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Tiết kiệm:</span>
                    <span>-{formatPrice(selectedDiscountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Phí vận chuyển</span>
                  <span>Sẽ tính ở bước tiếp theo</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">
                    {formatPrice(selectedAmount)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={selectedItemIds.length === 0}
                onClick={handleCheckout}
              >
                Mua hàng
              </Button>

              <Link to="/products">
                <Button variant="outline" className="w-full mt-5">
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
