import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
// import 'package:frontend_mobile/core/theme/app_color.dart'; // Bạn có thể dùng lại nếu muốn, mình sẽ dùng Colors trực tiếp để demo chuẩn theo ảnh
import 'package:frontend_mobile/features/address/data/models/address_model.dart';
import 'package:go_router/go_router.dart';

class AddressSelectPage extends ConsumerStatefulWidget {
  const AddressSelectPage({super.key});

  @override
  ConsumerState<AddressSelectPage> createState() => _AddressSelectPageState();
}

class _AddressSelectPageState extends ConsumerState<AddressSelectPage> {
  List<Address> _addresses = [];
  String? _selectedId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(addressRepositoryProvider);
      final res = await repo.getMyAddresses();
      setState(() {
        _addresses = res.addresses;
        _selectedId =
            res.defaultAddressId ??
            (res.addresses.isNotEmpty ? res.addresses.first.id : null);
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _onAddNew() async {
    final created = await context.pushNamed('address-form') as Address?;
    if (created != null) {
      await _loadAddresses();
      setState(() => _selectedId = created.id);
    }
  }

  Future<void> _onEdit(Address addr) async {
    final updated =
        await context.pushNamed('address-form', extra: addr) as Address?;
    if (updated != null) {
      await _loadAddresses();
      setState(() => _selectedId = updated.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        // leading: IconButton(
        //   icon: Icon(Icons.arrow_back),
        //   onPressed: () => Navigator.of(context).pop(),
        // ),
        title: const Text(
          'Chọn địa chỉ',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        ),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator.adaptive())
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header xám "Address"
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  color: Colors.grey[200],
                  child: const Text(
                    'Địa chỉ',
                    style: TextStyle(color: Colors.grey, fontSize: 14),
                  ),
                ),

                // Danh sách địa chỉ
                Expanded(
                  child: _addresses.isEmpty
                      ? _buildEmptyState()
                      : ListView.separated(
                          itemCount: _addresses.length,
                          separatorBuilder: (context, index) =>
                              const Divider(height: 1, thickness: 0.5),
                          itemBuilder: (context, index) {
                            final addr = _addresses[index];
                            return _buildAddressItem(addr);
                          },
                        ),
                ),

                // Nút Add new address ở dưới cùng
                _buildBottomButton(),
              ],
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Bạn chưa có địa chỉ nào'),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildAddressItem(Address addr) {
    // Logic xử lý chọn và back về
    void onSelect() {
      setState(() => _selectedId = addr.id);
      // Trả về đối tượng address cho màn hình Checkout
      Navigator.pop(context, addr);
    }

    return InkWell(
      onTap: onSelect, // Bấm vào khung -> Chọn và back
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Radio Button
            Padding(
              padding: const EdgeInsets.only(top: 2.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: Radio<String>(
                  value: addr.id,
                  groupValue: _selectedId,
                  activeColor: AppColor.buttonprimaryCol,
                  onChanged: (val) =>
                      onSelect(), // Bấm vào nút tròn -> Chọn và back
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Thông tin địa chỉ
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: RichText(
                          text: TextSpan(
                            style: const TextStyle(
                              color: Colors.black,
                              fontSize: 15,
                            ),
                            children: [
                              TextSpan(
                                text: addr.recipientName,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const TextSpan(
                                text: ' | ',
                                style: TextStyle(color: Colors.grey),
                              ),
                              TextSpan(
                                text: addr.phone,
                                style: const TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // Nút Edit dùng GestureDetector để không bị dính sự kiện click của InkWell cha
                      GestureDetector(
                        onTap: () => _onEdit(addr),
                        child: Container(
                          padding: const EdgeInsets.only(
                            left: 8,
                            bottom: 4,
                            top: 4,
                          ),
                          color: Colors.transparent, // Tăng vùng bấm
                          child: const Text(
                            'Chỉnh sửa',
                            style: TextStyle(
                              color: AppColor
                                  .buttonprimaryCol, // Sửa lại màu cho đúng biến của bạn
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  Text(
                    addr.specificAddress,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.black87,
                      height: 1.4,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    '${addr.fullAddress}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.black87,
                      height: 1.4,
                    ),
                  ),

                  const SizedBox(height: 8),

                  if (addr.isDefault)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: AppColor.buttonprimaryCol,
                          width: 0.5,
                        ),
                        borderRadius: BorderRadius.circular(
                          2,
                        ), // Chỉnh bo góc nhỏ lại cho giống ảnh mẫu trước
                      ),
                      child: const Text(
                        'Mặc định',
                        style: TextStyle(
                          color: AppColor.buttonprimaryCol,
                          fontSize: 10,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomButton() {
    return SafeArea(
      bottom: true,

      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.1),
              spreadRadius: 1,
              blurRadius: 1,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: InkWell(
          onTap: _onAddNew,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.add_circle_outline,
                color: AppColor.buttonprimaryCol,
                size: 22,
              ),
              const SizedBox(width: 8),
              Text(
                'Thêm địa chỉ mới',
                style: TextStyle(
                  color: AppColor.buttonprimaryCol,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
