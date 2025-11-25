class Address {
  final String id;              // dùng cho address list
  final String recipientName;
  final String phone;
  final String provinceCode;
  final String districtCode;
  final String wardCode;
  final String specificAddress;
  final bool isDefault;

  final String? provinceName;
  final String? districtName;
  final String? wardName;
  final String? fullAddress;

  Address({
    required this.id,
    required this.recipientName,
    required this.phone,
    required this.provinceCode,
    required this.districtCode,
    required this.wardCode,
    required this.specificAddress,
    required this.isDefault,
    this.provinceName,
    this.districtName,
    this.wardName,
    this.fullAddress,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      // preview.shipping_address không có _id -> cho default ''
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      recipientName: json['recipient_name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      provinceCode: json['province_code'] as String? ?? '',
      districtCode: json['district_code'] as String? ?? '',
      wardCode: json['ward_code'] as String? ?? '',
      specificAddress: json['specific_address'] as String? ?? '',
      // trong shipping_address không có is_default -> false
      isDefault: json['is_default'] as bool? ?? false,

      // đọc thêm các field mới
      provinceName: json['province_name'] as String?,
      districtName: json['district_name'] as String?,
      wardName: json['ward_name'] as String?,
      fullAddress: json['full_address'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'recipient_name': recipientName,
      'phone': phone,
      'province_code': provinceCode,
      'district_code': districtCode,
      'ward_code': wardCode,
      'specific_address': specificAddress,
      'is_default': isDefault,
      // KHÔNG cần gửi province_name / full_address lên BE
      // vì BE tự derive ra từ code + specific_address
    };
  }
}


class SimpleGeo {
  final String code;
  final String name;

  SimpleGeo({required this.code, required this.name});

  factory SimpleGeo.fromJson(Map<String, dynamic> json) {
    return SimpleGeo(
      code: json['code'] as String,
      name: json['name'] as String,
    );
  }
}
