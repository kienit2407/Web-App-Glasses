// lib/features/address/data/address_repository.dart
import 'package:frontend_mobile/core/network/dio_config.dart';
import 'package:frontend_mobile/features/address/data/models/address_model.dart';
import 'package:frontend_mobile/features/address/data/models/my_addresses_response.dart';

class AddressRepository {
  final DioClient dioClient;
  AddressRepository(this.dioClient);

  Future<MyAddressesResponse> getMyAddresses() async {
    final res = await dioClient.dio.get('/users/me/address');
    final data = res.data['data'] as Map<String, dynamic>;
    return MyAddressesResponse.fromJson(data);
  }

  Future<void> createAddress(Address addr) async {
    await dioClient.dio.post('/users/me/address', data: addr.toJson());
  }

  Future<void> updateAddress(String id, Address addr) async {
    await dioClient.dio.patch('/users/me/address/$id', data: addr.toJson());
  }

  Future<void> deleteAddress(String id) async {
    await dioClient.dio.delete('/users/me/address/$id');
  }

  Future<void> setDefault(String id) async {
    await dioClient.dio.patch('/users/me/address/$id/default');
  }

  Future<List<SimpleGeo>> getProvinces() async {
    final res = await dioClient.dio.get('/geo/provinces');
    final list = res.data['data'] as List<dynamic>? ?? [];
    return list.map((e) => SimpleGeo.fromJson(e)).toList();
  }

  Future<List<SimpleGeo>> getDistricts(String provinceCode) async {
    final res = await dioClient.dio.get(
      '/geo/districts',
      queryParameters: {'province_code': provinceCode},
    );
    final list = res.data['data'] as List<dynamic>? ?? [];
    return list.map((e) => SimpleGeo.fromJson(e)).toList();
  }

  Future<List<SimpleGeo>> getWards(String districtCode) async {
    final res = await dioClient.dio.get(
      '/geo/wards',
      queryParameters: {'district_code': districtCode},
    );
    final list = res.data['data'] as List<dynamic>? ?? [];
    return list.map((e) => SimpleGeo.fromJson(e)).toList();
  }
}
