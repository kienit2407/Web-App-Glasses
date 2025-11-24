// lib/features/auth/data/models/user_model.dart
class DeliveringAddress {
  final String id;
  final String recipientName;
  final String phone;
  final String provinceCode;
  final String districtCode;
  final String wardCode;
  final String specificAddress;
  final bool isDefault;

  DeliveringAddress({
    required this.id,
    required this.recipientName,
    required this.phone,
    required this.provinceCode,
    required this.districtCode,
    required this.wardCode,
    required this.specificAddress,
    required this.isDefault,
  });

  factory DeliveringAddress.fromJson(Map<String, dynamic> json) {
    return DeliveringAddress(
      id: json['_id'] as String? ?? '',
      recipientName: json['recipient_name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      provinceCode: json['province_code'] as String? ?? '',
      districtCode: json['district_code'] as String? ?? '',
      wardCode: json['ward_code'] as String? ?? '',
      specificAddress: json['specific_address'] as String? ?? '',
      isDefault: json['is_default'] as bool? ?? false,
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
    };
  }
}

class LastLogin {
  final String device;
  final String? ip;
  final DateTime? atTime;

  LastLogin({required this.device, this.ip, this.atTime});

  factory LastLogin.fromJson(Map<String, dynamic> json) {
    return LastLogin(
      device: json['device'] as String? ?? '',
      ip: json['ip'] as String?,
      atTime: json['atTime'] != null
          ? DateTime.tryParse(json['atTime'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'device': device, 'ip': ip, 'atTime': atTime?.toIso8601String()};
  }
}

class UserModel {
  final String id;
  final String email;
  final String? displayName;
  final String? authProvider;
  final String? avatarUrl;
  final String? avatarId;
  final List<String> roles;
  final bool isActive;
  final bool isShow;
  final LastLogin? lastLogin;
  final List<DeliveringAddress> deliveringAddresses;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  UserModel({
    required this.id,
    required this.email,
    this.displayName,
    this.authProvider,
    this.avatarUrl,
    this.avatarId,
    required this.roles,
    required this.isActive,
    required this.isShow,
    this.lastLogin,
    required this.deliveringAddresses,
    this.createdAt,
    this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final addressesJson =
        (json['delivering_addresses'] as List<dynamic>? ?? []);

    return UserModel(
      id: json['_id'] as String? ?? '',
      email: json['email'] as String? ?? '',
      displayName: json['display_name'] as String?,
      authProvider: json['auth_provider'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      avatarId: json['avatar_id'] as String?,
      roles:
          (json['roles'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      isActive: json['is_active'] as bool? ?? true,
      isShow: json['is_show'] as bool? ?? true,
      lastLogin: json['last_login'] != null
          ? LastLogin.fromJson(json['last_login'] as Map<String, dynamic>)
          : null,
      deliveringAddresses: addressesJson
          .map((e) => DeliveringAddress.fromJson(e as Map<String, dynamic>))
          .toList(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'email': email,
      'display_name': displayName,
      'auth_provider': authProvider,
      'avatar_url': avatarUrl,
      'avatar_id': avatarId,
      'roles': roles,
      'is_active': isActive,
      'is_show': isShow,
      'last_login': lastLogin?.toJson(),
      'delivering_addresses': deliveringAddresses
          .map((e) => e.toJson())
          .toList(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }
}
