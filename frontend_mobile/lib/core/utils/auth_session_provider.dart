// lib/core/auth/auth_session_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

final isLoggedInProvider = StateProvider<bool>((ref) => false);
