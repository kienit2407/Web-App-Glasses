import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/core/theme/app_color.dart'; // Đảm bảo import đúng file chứa màu của bạn
import 'package:frontend_mobile/features/address/data/models/address_model.dart';

// Enum để quản lý trạng thái đang chọn cấp nào
enum _RegionStep { province, district, ward }

class RegionResult {
  final SimpleGeo province;
  final SimpleGeo district;
  final SimpleGeo ward;

  RegionResult({
    required this.province,
    required this.district,
    required this.ward,
  });
}

class RegionSelectPage extends ConsumerStatefulWidget {
  const RegionSelectPage({
    super.key,
    this.initialProvinceCode,
    this.initialDistrictCode,
    this.initialWardCode,
  });

  final String? initialProvinceCode;
  final String? initialDistrictCode;
  final String? initialWardCode;

  @override
  ConsumerState<RegionSelectPage> createState() => _RegionSelectPageState();
}

class _RegionSelectPageState extends ConsumerState<RegionSelectPage> {
  late ScrollController _scrollController;
  _RegionStep _step = _RegionStep.province;

  List<SimpleGeo> _provinces = [];
  List<SimpleGeo> _districts = [];
  List<SimpleGeo> _wards = [];

  SimpleGeo? _selectedProvince;
  SimpleGeo? _selectedDistrict;
  SimpleGeo? _selectedWard;

  // Getter để lấy title cho list bên dưới
  String get _currentStepTitle {
    switch (_step) {
      case _RegionStep.province:
        return 'Tỉnh / Thành phố';
      case _RegionStep.district:
        return 'Quận / Huyện';
      case _RegionStep.ward:
        return 'Phường / Xã';
    }
  }

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();

    _loadInitial();
  }
  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
  Future<void> _loadInitial() async {
    final repo = ref.read(addressRepositoryProvider);

    // Load Province
    final provinces = await repo.getProvinces();
    setState(() => _provinces = provinces);

    // Logic fill lại dữ liệu cũ nếu có (Edit mode)
    if (widget.initialProvinceCode != null) {
      try {
        final p = provinces.firstWhere(
          (e) => e.code == widget.initialProvinceCode,
        );
        _selectedProvince = p;
        _step = _RegionStep.district;

        final districts = await repo.getDistricts(p.code);
        setState(() => _districts = districts);

        if (widget.initialDistrictCode != null) {
          final d = districts.firstWhere(
            (e) => e.code == widget.initialDistrictCode,
          );
          _selectedDistrict = d;
          _step = _RegionStep.ward;

          final wards = await repo.getWards(d.code);
          setState(() => _wards = wards);

          if (widget.initialWardCode != null) {
            _selectedWard = wards.firstWhere(
              (e) => e.code == widget.initialWardCode,
            );
          }
        }
      } catch (e) {
        // Fallback nếu data cũ bị lỗi
        _reset();
      }
    }
    if (mounted) setState(() {});
  }

  void _reset() {
    setState(() {
      _step = _RegionStep.province;
      _districts = [];
      _wards = [];
      _selectedProvince = null;
      _selectedDistrict = null;
      _selectedWard = null;
    });
  }

  // Hàm xử lý khi chọn 1 item trong list
  Future<void> _onSelectItem(SimpleGeo item) async {
    final repo = ref.read(addressRepositoryProvider);

    if (_step == _RegionStep.province) {
      setState(() {
        _selectedProvince = item;
        _selectedDistrict = null; // Reset cấp con
        _selectedWard = null;
        _step = _RegionStep.district;
      });
      // Load District
      final districts = await repo.getDistricts(item.code);
      if (mounted) setState(() => _districts = districts);
    } else if (_step == _RegionStep.district) {
      setState(() {
        _selectedDistrict = item;
        _selectedWard = null;
        _step = _RegionStep.ward;
      });
      // Load Ward
      final wards = await repo.getWards(item.code);
      if (mounted) setState(() => _wards = wards);
    } else {
      // Chọn Ward xong -> Trả kết quả về luôn
      setState(() => _selectedWard = item);
      if (_selectedProvince != null && _selectedDistrict != null) {
        Navigator.pop(
          context,
          RegionResult(
            province: _selectedProvince!,
            district: _selectedDistrict!,
            ward: item,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Xác định list data cần hiển thị
    List<SimpleGeo> currentList;
    switch (_step) {
      case _RegionStep.province:
        currentList = _provinces;
        break;
      case _RegionStep.district:
        currentList = _districts;
        break;
      case _RegionStep.ward:
        currentList = _wards;
        break;
    }

    return Scaffold(
      backgroundColor: const Color(0xfffafafa),
      appBar: AppBar(
        backgroundColor: AppColor.buttonprimaryCol,
        foregroundColor: Colors.white,
        elevation: 0,
        // leading: IconButton(
        //   icon: const Icon(Icons.arrow_back, color: AppColor.buttonprimaryCol),
        //   onPressed: () => Navigator.pop(context),
        // ),
        // Bạn có thể để title trống hoặc text tùy ý
        title: const Text(
          'Chọn khu vực',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- PHẦN HEADER TIMELINE (Giống ảnh) ---
          _buildSelectedHeader(),

          const Divider(thickness: 1, height: 1),

          // --- PHẦN TIÊU ĐỀ LIST ---
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.grey[100],
            child: Text(
              _currentStepTitle,
              style: const TextStyle(
                color: Colors.grey,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),

          // --- PHẦN LIST VIEW ---
          Expanded(
            child: Scrollbar(
              controller: _scrollController,
              child: ListView.separated(
                controller: _scrollController,
                itemCount: currentList.length,
                separatorBuilder: (_, __) => const Divider(height: 1, indent: 16),
                itemBuilder: (context, index) {
                  final item = currentList[index];
              
                  // Kiểm tra xem item này có đang được chọn không
                  bool isSelected = false;
                  if (_step == _RegionStep.province)
                    isSelected = item.code == _selectedProvince?.code;
                  if (_step == _RegionStep.district)
                    isSelected = item.code == _selectedDistrict?.code;
                  if (_step == _RegionStep.ward)
                    isSelected = item.code == _selectedWard?.code;
              
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    title: Text(
                      item.name,
                      style: TextStyle(
                        fontSize: 13,
                        color: isSelected
                            ? AppColor.buttonprimaryCol
                            : Colors.black87,
                        fontWeight: isSelected
                            ? FontWeight.w500
                            : FontWeight.normal,
                      ),
                    ),
                    trailing: isSelected
                        ? const Icon(
                            Icons.check,
                            color: AppColor.buttonprimaryCol,
                          )
                        : null,
                    onTap: () => _onSelectItem(item),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Widget xây dựng phần hiển thị các cấp đã chọn (Timeline)
  Widget _buildSelectedHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      color: Colors.white,
      child: Column(
        children: [
          // Dòng tiêu đề "Region Selected" và nút Reset
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Khu vực của bạn',
                style: TextStyle(fontSize: 13, color: Colors.grey),
              ),
              TextButton(
                onPressed: _reset,
                child: const Text(
                  'Làm mới',
                  style: TextStyle(color: AppColor.buttonprimaryCol),
                ),
              ),
            ],
          ),

          // Các dòng hiển thị cấp độ
          // 1. Province
          if (_selectedProvince != null)
            _buildTimelineItem(
              text: _selectedProvince!.name,
              isActive:
                  _step ==
                  _RegionStep
                      .province, // Active khi đang ở bước này (trường hợp quay lại sửa)
              isLast:
                  _step ==
                  _RegionStep
                      .province, // Nếu là bước hiện tại thì nó là cuối cùng hiển thị
            )
          else if (_step == _RegionStep.province)
            _buildActiveBox(text: 'Chọn Tỉnh / Thành phố'),

          // 2. District
          if (_selectedProvince != null) ...[
            if (_selectedDistrict != null)
              _buildTimelineItem(
                text: _selectedDistrict!.name,
                isActive: _step == _RegionStep.district,
                isLast: _step == _RegionStep.district,
              )
            else if (_step == _RegionStep.district)
              _buildActiveBox(text: 'Chọn Quận / Huyện'),
          ],

          // 3. Ward
          if (_selectedDistrict != null) ...[
            if (_selectedWard != null)
              _buildTimelineItem(
                text: _selectedWard!.name,
                isActive: true, // Ward là bước cuối
                isLast: true,
              )
            else if (_step == _RegionStep.ward)
              _buildActiveBox(text: 'Chọn Phường / Xã'),
          ],
        ],
      ),
    );
  }

  // Item dạng text thường + chấm tròn (cho các bước đã qua)
  Widget _buildTimelineItem({
    required String text,
    required bool isActive,
    required bool isLast,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 6),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.grey[300],
                  ),
                ),
                if (!isLast) // Chỉ hiện đường kẻ nếu không phải item cuối
                  Expanded(child: Container(width: 1, color: Colors.grey[300])),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(top: 2, bottom: 12),
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w400,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Box có viền đỏ cho bước đang chọn hiện tại (Giống ảnh)
  Widget _buildActiveBox({required String text}) {
    return Row(
      children: [
        // const SizedBox(
        //   width: 24,
        // ), // Thụt vào bằng với width của cột dot bên trên
        const SizedBox(width: 8),
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(top: 4),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              border: Border.all(
                color: AppColor.buttonprimaryCol.withOpacity(0.5),
              ),
              borderRadius: BorderRadius.circular(8),
              color: Colors.white,
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.radio_button_checked,
                  color: AppColor.buttonprimaryCol,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Text(
                  text,
                  style: const TextStyle(
                    color: AppColor.buttonprimaryCol,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
