// lib/features/address/presentation/views/address_form_page.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/features/address/data/models/address_model.dart';
import 'package:frontend_mobile/features/address/data/repository/address_repository.dart';
import 'package:frontend_mobile/features/checkout/presentation/viewmodels/region_select_page.dart';

class AddressFormPage extends ConsumerStatefulWidget {
  const AddressFormPage({super.key, this.existing});

  final Address? existing;

  @override
  ConsumerState<AddressFormPage> createState() => _AddressFormPageState();
}

class _AddressFormPageState extends ConsumerState<AddressFormPage> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _specificCtrl;
  bool _isDefault = false;

  String? _provinceCode;
  String? _districtCode;
  String? _wardCode;

  String _regionText = '';

  bool _isSaving = false;

  AddressRepository get _repo => ref.read(addressRepositoryProvider);

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _nameCtrl = TextEditingController(text: existing?.recipientName ?? '');
    _phoneCtrl = TextEditingController(text: existing?.phone ?? '');
    _specificCtrl = TextEditingController(
      text: existing?.specificAddress ?? '',
    );
    _isDefault = existing?.isDefault ?? false;
    _provinceCode = existing?.provinceCode;
    _districtCode = existing?.districtCode;
    _wardCode = existing?.wardCode;

    if (existing != null) {
      _regionText = 'Đã chọn (Tỉnh/Huyện/Xã hiện tại)';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _specificCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickRegion() async {
    final result = await Navigator.push<RegionResult>(
      context,
      MaterialPageRoute(
        builder: (_) => RegionSelectPage(
          initialProvinceCode: _provinceCode,
          initialDistrictCode: _districtCode,
          initialWardCode: _wardCode,
        ),
      ),
    );
    if (result != null) {
      setState(() {
        _provinceCode = result.province.code;
        _districtCode = result.district.code;
        _wardCode = result.ward.code;
        _regionText =
            '${result.province.name}, ${result.district.name}, ${result.ward.name}';
      });
    }
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_provinceCode == null || _districtCode == null || _wardCode == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn City / District / Ward')),
      );
      return;
    }

    final addr = Address(
      id: widget.existing?.id ?? '',
      recipientName: _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      provinceCode: _provinceCode!,
      districtCode: _districtCode!,
      wardCode: _wardCode!,
      specificAddress: _specificCtrl.text.trim(),
      isDefault: _isDefault,
    );

    setState(() => _isSaving = true);
    try {
      if (widget.existing != null) {
        await _repo.updateAddress(widget.existing!.id, addr);
      } else {
        await _repo.createAddress(addr);
      }
      final res = await _repo.getMyAddresses();
      Address saved;
      if (widget.existing != null) {
        saved = res.addresses.firstWhere(
          (a) => a.id == widget.existing!.id,
          orElse: () => addr,
        );
      } else {
        saved = res.addresses.last;
      }
      if (mounted) Navigator.pop(context, saved);
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Không lưu được địa chỉ')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Edit Address' : 'New Address')),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Address',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _nameCtrl,
                            decoration: const InputDecoration(
                              hintText: 'Full Name',
                              border: InputBorder.none,
                            ),
                            validator: (v) => v == null || v.trim().isEmpty
                                ? 'Nhập tên'
                                : null,
                          ),
                          const Divider(height: 1),
                          TextFormField(
                            controller: _phoneCtrl,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              hintText: 'Phone Number',
                              border: InputBorder.none,
                            ),
                            validator: (v) => v == null || v.trim().isEmpty
                                ? 'Nhập SĐT'
                                : null,
                          ),
                          const Divider(height: 1),
                          InkWell(
                            onTap: _pickRegion,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      _regionText.isEmpty
                                          ? 'City, District, Ward'
                                          : _regionText,
                                      style: TextStyle(
                                        color: _regionText.isEmpty
                                            ? Colors.grey
                                            : Colors.black,
                                      ),
                                    ),
                                  ),
                                  const Icon(Icons.chevron_right),
                                ],
                              ),
                            ),
                          ),
                          const Divider(height: 1),
                          TextFormField(
                            controller: _specificCtrl,
                            maxLines: 2,
                            decoration: const InputDecoration(
                              hintText: 'Street Name, Building, House No.',
                              border: InputBorder.none,
                            ),
                            validator: (v) => v == null || v.trim().isEmpty
                                ? 'Nhập địa chỉ cụ thể'
                                : null,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Card(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        SwitchListTile(
                          title: const Text('Set as Default Address'),
                          value: _isDefault,
                          onChanged: (val) => setState(() => _isDefault = val),
                        ),
                        const Divider(height: 1),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          child: Row(
                            children: [
                              const Text('Label As:'),
                              const SizedBox(width: 12),
                              ChoiceChip(
                                label: const Text('Work'),
                                selected: false,
                                onSelected: (_) {},
                              ),
                              const SizedBox(width: 8),
                              ChoiceChip(
                                label: const Text('Home'),
                                selected: false,
                                onSelected: (_) {},
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _onSubmit,
                    child: _isSaving
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text('Submit'),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
