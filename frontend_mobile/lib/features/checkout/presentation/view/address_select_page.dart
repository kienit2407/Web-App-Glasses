import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:frontend_mobile/core/di/providers.dart';
import 'package:frontend_mobile/features/address/data/models/address_model.dart';

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
    final created =
        await Navigator.pushNamed(context, '/address-form') as Address?;
    if (created != null) {
      await _loadAddresses();
      setState(() => _selectedId = created.id);
    }
  }

  Future<void> _onEdit(Address addr) async {
    final updated =
        await Navigator.pushNamed(context, '/address-form', arguments: addr)
            as Address?;
    if (updated != null) {
      await _loadAddresses();
      setState(() => _selectedId = updated.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xfffaf5ff),
      appBar: AppBar(
        title: const Text('Address Selection'),
        elevation: 0,
        backgroundColor: const Color(0xfffaf5ff),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _addresses.isEmpty
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Bạn chưa có địa chỉ nào'),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _onAddNew,
                    child: const Text('Add a new address'),
                  ),
                ],
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _addresses.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final addr = _addresses[index];
                      final selected = addr.id == _selectedId;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedId = addr.id),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: selected
                                  ? theme.colorScheme.primary
                                  : Colors.grey.shade300,
                              width: selected ? 1.5 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.03),
                                blurRadius: 5,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Radio<String>(
                                value: addr.id,
                                groupValue: _selectedId,
                                onChanged: (val) =>
                                    setState(() => _selectedId = val),
                                materialTapTargetSize:
                                    MaterialTapTargetSize.shrinkWrap,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Expanded(
                                          child: Text.rich(
                                            TextSpan(
                                              text: addr.recipientName,
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                              ),
                                              children: [
                                                TextSpan(
                                                  text: ' (${addr.phone})',
                                                  style: const TextStyle(
                                                    fontWeight:
                                                        FontWeight.normal,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        TextButton(
                                          onPressed: () => _onEdit(addr),
                                          child: const Text('Edit'),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      addr.specificAddress,
                                      style: const TextStyle(fontSize: 13),
                                    ),
                                    if (addr.isDefault)
                                      Container(
                                        margin: const EdgeInsets.only(top: 6),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(
                                            4,
                                          ),
                                          border: Border.all(
                                            color: Colors.redAccent,
                                          ),
                                        ),
                                        child: const Text(
                                          'Default',
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: Colors.redAccent,
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
                    },
                  ),
                ),
                SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    child: Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _onAddNew,
                            style: OutlinedButton.styleFrom(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            child: const Text('Add a new address'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _selectedId == null
                                ? null
                                : () {
                                    final selected = _addresses.firstWhere(
                                      (e) => e.id == _selectedId,
                                    );
                                    Navigator.pop(context, selected);
                                  },
                            style: ElevatedButton.styleFrom(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            child: const Text('Use this address'),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
