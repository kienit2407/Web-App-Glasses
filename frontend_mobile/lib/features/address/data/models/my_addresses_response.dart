// lib/features/address/data/models/my_addresses_response.dart
import 'package:frontend_mobile/features/address/data/models/address_model.dart';


class MyAddressesResponse {
  final List<Address> addresses;
  final String? defaultAddressId;

  MyAddressesResponse({
    required this.addresses,
    required this.defaultAddressId,
  });

  factory MyAddressesResponse.fromJson(Map<String, dynamic> json) {
    final list = (json['addresses'] as List? ?? [])
        .map((e) => Address.fromJson(e as Map<String, dynamic>))
        .toList();

    return MyAddressesResponse(
      addresses: list,
      defaultAddressId: json['default_address_id'] as String?,
    );
  }
}
