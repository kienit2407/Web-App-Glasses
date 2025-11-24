// lib/features/address/presentation/views/region_select_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/features/address/data/models/address_model.dart';

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
  _RegionStep _step = _RegionStep.province;
  String _search = '';

  List<SimpleGeo> _provinces = [];
  List<SimpleGeo> _districts = [];
  List<SimpleGeo> _wards = [];

  SimpleGeo? _selectedProvince;
  SimpleGeo? _selectedDistrict;
  SimpleGeo? _selectedWard;

  @override
  void initState() {
    super.initState();
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    final repo = ref.read(addressRepositoryProvider);

    final provinces = await repo.getProvinces();
    setState(() => _provinces = provinces);

    if (widget.initialProvinceCode != null) {
      _selectedProvince = provinces.firstWhere(
        (p) => p.code == widget.initialProvinceCode,
        orElse: () => provinces.first,
      );
      _step = _RegionStep.district;
      final districts = await repo.getDistricts(_selectedProvince!.code);
      setState(() => _districts = districts);

      if (widget.initialDistrictCode != null) {
        _selectedDistrict = districts.firstWhere(
          (d) => d.code == widget.initialDistrictCode,
          orElse: () => districts.first,
        );
        _step = _RegionStep.ward;
        final wards = await repo.getWards(_selectedDistrict!.code);
        setState(() => _wards = wards);

        if (widget.initialWardCode != null) {
          _selectedWard = wards.firstWhere(
            (w) => w.code == widget.initialWardCode,
            orElse: () => wards.first,
          );
        }
      }
    }
    if (mounted) setState(() {});
  }

  void _reset() {
    setState(() {
      _step = _RegionStep.province;
      _search = '';
      _districts = [];
      _wards = [];
      _selectedProvince = null;
      _selectedDistrict = null;
      _selectedWard = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final repo = ref.read(addressRepositoryProvider);

    List<SimpleGeo> list;
    switch (_step) {
      case _RegionStep.province:
        list = _provinces;
        break;
      case _RegionStep.district:
        list = _districts;
        break;
      case _RegionStep.ward:
        list = _wards;
        break;
    }

    if (_search.isNotEmpty) {
      list = list
          .where((e) => e.name.toLowerCase().contains(_search.toLowerCase()))
          .toList();
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Chọn khu vực')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Search City, District, Ward',
                isDense: true,
                border: OutlineInputBorder(),
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
          if (_selectedProvince != null || _selectedDistrict != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  const Text(
                    'Region Selected',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  TextButton(onPressed: _reset, child: const Text('Reset')),
                ],
              ),
            ),
          if (_selectedProvince != null || _selectedDistrict != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_selectedProvince != null) Text(_selectedProvince!.name),
                  if (_selectedDistrict != null) Text(_selectedDistrict!.name),
                  if (_selectedWard != null) Text(_selectedWard!.name),
                ],
              ),
            ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _step == _RegionStep.province
                    ? 'City'
                    : _step == _RegionStep.district
                    ? 'District'
                    : 'Ward',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView.builder(
              itemCount: list.length,
              itemBuilder: (context, index) {
                final item = list[index];
                return ListTile(
                  title: Text(item.name),
                  onTap: () async {
                    if (_step == _RegionStep.province) {
                      _selectedProvince = item;
                      _selectedDistrict = null;
                      _selectedWard = null;
                      _step = _RegionStep.district;
                      _search = '';
                      _districts = await repo.getDistricts(
                        _selectedProvince!.code,
                      );
                      _wards = [];
                    } else if (_step == _RegionStep.district) {
                      _selectedDistrict = item;
                      _selectedWard = null;
                      _step = _RegionStep.ward;
                      _search = '';
                      _wards = await repo.getWards(_selectedDistrict!.code);
                    } else {
                      _selectedWard = item;
                    }
                    if (mounted) setState(() {});
                  },
                );
              },
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed:
                      _selectedProvince != null &&
                          _selectedDistrict != null &&
                          _selectedWard != null
                      ? () {
                          Navigator.pop(
                            context,
                            RegionResult(
                              province: _selectedProvince!,
                              district: _selectedDistrict!,
                              ward: _selectedWard!,
                            ),
                          );
                        }
                      : null,
                  child: const Text('OK'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
