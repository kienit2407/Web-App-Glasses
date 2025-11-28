import 'dart:async';
import 'package:flutter/material.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';

enum _PromoTimeStatus { upcoming, running, endless, ended }

class PromotionCountdownChip extends StatefulWidget {
  final DateTime startDate;
  final DateTime? endDate;

  const PromotionCountdownChip({
    super.key,
    required this.startDate,
    this.endDate,
  });

  @override
  State<PromotionCountdownChip> createState() => _PromotionCountdownChipState();
}

class _PromotionCountdownChipState extends State<PromotionCountdownChip> {
  late _PromoTimeStatus _status;
  Duration _remaining = Duration.zero;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _recompute();
    // cập nhật mỗi giây
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _recompute());
  }

  void _recompute() {
    final now = DateTime.now();
    final start = widget.startDate;
    final end = widget.endDate;

    _PromoTimeStatus newStatus;
    Duration newRemaining = Duration.zero;

    if (now.isBefore(start)) {
      newStatus = _PromoTimeStatus.upcoming;
      newRemaining = start.difference(now);
    } else if (end == null) {
      newStatus = _PromoTimeStatus.endless;
      newRemaining = Duration.zero;
    } else if (now.isBefore(end)) {
      newStatus = _PromoTimeStatus.running;
      newRemaining = end.difference(now);
    } else {
      newStatus = _PromoTimeStatus.ended;
      newRemaining = Duration.zero;
    }

    if (!mounted) return;
    setState(() {
      _status = newStatus;
      _remaining = newRemaining;
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    if (d.isNegative) d = Duration.zero;
    final days = d.inDays;
    final hours = d.inHours % 24;
    final minutes = d.inMinutes % 60;
    final seconds = d.inSeconds % 60;

    final hh = hours.toString().padLeft(2, '0');
    final mm = minutes.toString().padLeft(2, '0');
    final ss = seconds.toString().padLeft(2, '0');

    if (days > 0) {
      return '$days ngày $hh:$mm:$ss';
    }
    return '$hh:$mm:$ss';
  }

  @override
  Widget build(BuildContext context) {
    String label;
    Color chipBg;
    Color textColor;

    switch (_status) {
      case _PromoTimeStatus.upcoming:
        label = 'Sắp diễn ra trong';
        chipBg = AppColor.buttonprimaryCol.withOpacity(0.12);
        textColor = AppColor.buttonprimaryCol;
        break;
      case _PromoTimeStatus.running:
        label = 'Còn lại';
        chipBg = Colors.green.withOpacity(0.12);
        textColor = Colors.green.shade700;
        break;
      case _PromoTimeStatus.endless:
        label = 'Đang diễn ra (không giới hạn thời gian)';
        chipBg = Colors.green.withOpacity(0.12);
        textColor = Colors.green.shade700;
        break;
      case _PromoTimeStatus.ended:
        label = 'Đã kết thúc';
        chipBg = Colors.grey.withOpacity(0.15);
        textColor = Colors.grey;
        break;
    }

    // Trường hợp endless / ended: chỉ hiện text, không countdown số
    final showTimer =
        _status == _PromoTimeStatus.upcoming || _status == _PromoTimeStatus.running;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: chipBg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.access_time_rounded,
            size: 14,
            color: textColor,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: textColor,
              fontWeight: FontWeight.w500,
            ),
          ),
          if (showTimer) ...[
            const SizedBox(width: 4),
            Text(
              _formatDuration(_remaining),
              style: TextStyle(
                fontSize: 11,
                color: textColor,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
