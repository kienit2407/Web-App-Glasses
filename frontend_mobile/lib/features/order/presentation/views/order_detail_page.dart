import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/contants/url_config.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:go_router/go_router.dart';
import 'package:iconsax_flutter/iconsax_flutter.dart';
import 'package:qr_flutter/qr_flutter.dart';

class OrderDetailPage extends ConsumerStatefulWidget {
  const OrderDetailPage({super.key, required this.orderId});

  final String orderId;

  @override
  ConsumerState<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends ConsumerState<OrderDetailPage> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadDetail);
  }

  Future<void> _loadDetail() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(orderRepositoryProvider);
      final data = await repo.fetchOrderDetail(widget.orderId);
      setState(() {
        _data = data;
      });
    } catch (e) {
      setState(() {
        _error = 'Không tải được chi tiết đơn hàng';
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  // Helper format
  String _formatPrice(num price) {
    final str = price.toInt().toString();
    final reg = RegExp(r'\B(?=(\d{3})+(?!\d))');
    return str.replaceAllMapped(reg, (m) => '.') + 'đ';
  }

  String _formatDateTime(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(dt.day)}/${two(dt.month)}/${dt.year} ${two(dt.hour)}:${two(dt.minute)}';
  }

  // Helper màu sắc trạng thái
  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'processing':
        return Colors.blue;
      case 'shipping':
        return Colors.teal;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.grey;
      case 'returned':
        return Colors.red;
      default:
        return Colors.black;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'shipping':
        return 'Đang vận chuyển';
      case 'delivering':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã huỷ';
      case 'returned':
        return 'Đã trả hàng';
      default:
        return status;
    }
  }

  void _showQrDialog(String orderNumber) {
    final orderUrl = '${UrlConfig.baseUrl}/orders/$orderNumber';
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Mã QR Đơn hàng',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              QrImageView(data: orderUrl, size: 200),
              const SizedBox(height: 16),
              Text(
                orderNumber,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: const Color(0xffF5F5F5),
        appBar: AppBar(
          backgroundColor: AppColor.buttonprimaryCol,
          foregroundColor: Colors.white,
          title: const Text('Chi tiết đơn hàng'),
          elevation: 0,
        ),
        body: const Center(child: CircularProgressIndicator.adaptive()),
      );
    }

    if (_error != null || _data == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chi tiết đơn hàng')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Iconsax.receipt_item, size: 64, color: Colors.grey),
              const SizedBox(height: 12),
              Text(_error ?? 'Lỗi không xác định'),
              TextButton(onPressed: _loadDetail, child: const Text('Thử lại')),
            ],
          ),
        ),
      );
    }

    final order = _data!['order'] as Map<String, dynamic>;
    final items = (_data!['items'] as List).cast<Map<String, dynamic>>();

    // Parse data
    final orderNumber = order['order_number']?.toString() ?? widget.orderId;
    final status = order['order_status']?.toString() ?? '';
    final createdAt = _formatDateTime(order['createdAt'] as String?);

    // Money
    final totalAmount = (order['total_amount'] ?? 0) as num;
    final subtotal = (order['subtotal'] ?? 0) as num;
    final discount = (order['discount_amount'] ?? 0) as num;
    final shippingFee = (order['shipping_fee'] ?? 0) as num;

    // Address
    final shipping = (order['shipping_address'] ?? {}) as Map<String, dynamic>;
    final recipientName = shipping['recipient_name']?.toString() ?? '';
    final phone = shipping['phone']?.toString() ?? '';
    final fullAddress = shipping['full_address']?.toString() ?? "";
    final specificAdress = shipping['specific_address']?.toString() ?? "";
    // Coupon
    final couponCodeRaw = order['coupon_code'];
    final String? couponCode = couponCodeRaw?.toString();
    return Scaffold(
      backgroundColor: const Color(0xffF2F4F8), // Màu nền xám xanh nhẹ hiện đại
      appBar: AppBar(
        title: const Text(
          'Chi tiết đơn hàng',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadDetail,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. HEADER CARD (Mã đơn, trạng thái text)
              _buildHeaderCard(orderNumber, status, createdAt),

              const SizedBox(height: 12),

              // 2. STEPPER NGANG (Giống ảnh 1)
              _buildHorizontalStepper(status),

              const SizedBox(height: 12),

              // 3. ĐỊA CHỈ NHẬN HÀNG
              _buildAddressCard(recipientName, phone, specificAdress, fullAddress),

              const SizedBox(height: 12),

              // 4. DANH SÁCH SẢN PHẨM
              _buildProductList(items),

              const SizedBox(height: 12),

              // 5. TỔNG TIỀN ACCORDION (Sổ ra sổ vào - Giống ảnh 2,3)
              _buildPaymentAccordion(
                subtotal,
                shippingFee,
                discount,
                totalAmount,
                couponCode: couponCode,
              ),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  // --- WIDGETS CON ---

  Widget _buildHeaderCard(String orderId, String status, String date) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.withOpacity(.8), width: .3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Text('Mã đơn hàng: ', style: TextStyle(color: Colors.grey)),
              Expanded(
                child: Text(
                  orderId,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              // NÚT COPY ANIMATION
              _CopyButton(textToCopy: orderId),
              const SizedBox(width: 8),
              InkWell(
                onTap: () => _showQrDialog(orderId),
                child: const Icon(Iconsax.scan_barcode, size: 22),
              ),
            ],
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                date,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: _statusColor(status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _statusLabel(status).toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: _statusColor(status),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalStepper(String currentStatus) {
    // Nếu đơn bị huỷ/trả thì không hiện stepper này
    if (['cancelled', 'returned'].contains(currentStatus)) {
      return const SizedBox.shrink();
    }

    const steps = ['pending', 'processing', 'shipping', 'delivered'];
    final labels = ['Đã đặt', 'Đang xử lý', 'Vận chuyển', 'Đã giao'];

    // Mapping trạng thái 'delivering' về 'shipping' cho visual
    final normalized = currentStatus == 'delivering'
        ? 'shipping'
        : currentStatus;

    int activeIndex = steps.indexOf(normalized);
    if (activeIndex == -1 && currentStatus == 'delivered') activeIndex = 3;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: BorderDirectional(
          top: BorderSide(color: Colors.grey.withOpacity(.8), width: .3),
        ),
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.white, Colors.green.shade50.withOpacity(0.3)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Trạng thái đơn hàng',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 16),
          Row(
            children: List.generate(steps.length, (index) {
              final isActive = index <= activeIndex;
              final isLast = index == steps.length - 1;

              return Expanded(
                flex: isLast ? 0 : 1, // Item cuối không cần expand line
                child: Row(
                  children: [
                    // DOT / ICON
                    Column(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: isActive
                                ? Colors.teal
                                : Colors.grey.shade300,
                            shape: BoxShape.circle,
                            border: isActive
                                ? Border.all(
                                    color: Colors.teal.shade100,
                                    width: 4,
                                  )
                                : null,
                          ),
                          child: isActive
                              ? const Icon(
                                  Icons.check,
                                  size: 14,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          labels[index],
                          style: TextStyle(
                            fontSize: 10,
                            color: isActive ? Colors.teal : Colors.grey,
                            fontWeight: isActive
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                    // LINE (Nối tiếp)
                    if (!isLast)
                      Expanded(
                        child: Container(
                          height: 3,
                          margin: const EdgeInsets.only(
                            bottom: 20,
                            left: 4,
                            right: 4,
                          ), // margin bottom để căn giữa với dot
                          color: index < activeIndex
                              ? Colors.teal
                              : Colors.grey.shade200,
                        ),
                      ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard(String name, String phone,String specificAdress, String fullAddress) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.withOpacity(.8), width: .3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Iconsax.location,
            color: AppColor.buttonprimaryCol,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Địa chỉ nhận hàng',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text('$name | $phone', style: const TextStyle(fontSize: 13)),
                const Divider(thickness: .8,),
                Text(
                  specificAdress,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.black87,
                    fontWeight: FontWeight.w600,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  fullAddress,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[700],
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductList(List<Map<String, dynamic>> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey.withOpacity(.8), width: .3),
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Kiện hàng',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ListView.separated(
            shrinkWrap: true,
            reverse: false,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 24),
            itemBuilder: (context, index) {
              final it = items[index];
              final attrs = (it['attributes'] ?? {}) as Map<String, dynamic>;

              // chỉ lấy 3 field cần thiết
              final material = (attrs['frame_material'] ?? '').toString();
              final color = (attrs['frame_color'] ?? '').toString();
              final shape = (attrs['frame_shape'] ?? '').toString();

              final variantParts = <String>[];
              if (material.isNotEmpty) variantParts.add(material);
              if (color.isNotEmpty) variantParts.add(color);
              if (shape.isNotEmpty) variantParts.add(shape);

              final variant = variantParts.join(' - ');

              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Ảnh sản phẩm
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      it['thumbnail_url'] ?? '',
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: Colors.grey[200],
                        width: 70,
                        height: 70,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Thông tin
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          it['name'] ?? '',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 14),
                        ),
                        if (variant.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              'Phân loại: $variant',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'x${it['quantity']}',
                              style: const TextStyle(fontSize: 13),
                            ),
                            Text(
                              _formatPrice(it['total'] ?? 0),
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  // --- WIDGET SỔ RA SỔ VÀO (ACCORDION) ---
  Widget _buildPaymentAccordion(
    num subtotal,
    num shipping,
    num discount,
    num total, {
    String? couponCode,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(.8), width: .3),
      ),
      child: Theme(
        // Bỏ đường kẻ mặc định của ExpansionTile
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: false, // Mặc định đóng
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),

          // Tiêu đề khi đóng/mở (Luôn hiện Tổng tiền)
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tổng thanh toán',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
              Text(
                _formatPrice(total),
                style: const TextStyle(
                  color: AppColor.buttonprimaryCol,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),

          // Nội dung sổ ra
          children: [
            const Divider(height: 1, thickness: 0.5),
            const SizedBox(height: 12),
            _buildPriceRow('Tổng tiền hàng', _formatPrice(subtotal)),
            _buildPriceRow('Phí vận chuyển', _formatPrice(shipping)),
            // --- Giảm giá: nếu có mã thì hiển thị kèm mã ---
            _buildPriceRow(
              (couponCode != null && couponCode.isNotEmpty)
                  ? 'Giảm giá (mã $couponCode)'
                  : 'Giảm giá',
              '-${_formatPrice(discount)}',
              valueColor: Colors.green,
            ),
            _buildPriceRow(
              'Voucher sàn',
              '-0đ',
              valueColor: Colors.green,
            ), // Ví dụ thêm
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(
            value,
            style: TextStyle(fontSize: 13, color: valueColor ?? Colors.black87),
          ),
        ],
      ),
    );
  }
}

// --- WIDGET NÚT SAO CHÉP ANIMATION ---
class _CopyButton extends StatefulWidget {
  final String textToCopy;
  const _CopyButton({required this.textToCopy});

  @override
  State<_CopyButton> createState() => _CopyButtonState();
}

class _CopyButtonState extends State<_CopyButton> {
  bool _isCopied = false;

  void _handleCopy() {
    Clipboard.setData(ClipboardData(text: widget.textToCopy));
    setState(() => _isCopied = true);

    // Sau 2 giây tự đổi lại icon copy
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _isCopied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleCopy,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        transitionBuilder: (child, anim) =>
            ScaleTransition(scale: anim, child: child),
        child: _isCopied
            ? const Icon(
                Icons.check_circle,
                key: ValueKey('check'),
                color: Colors.green,
                size: 20,
              )
            : const Icon(
                Icons.copy,
                key: ValueKey('copy'),
                color: AppColor.buttonprimaryCol,
                size: 20,
              ),
      ),
    );
  }
}
