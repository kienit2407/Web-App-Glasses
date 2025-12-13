import 'package:flutter/material.dart';
import 'package:frontend_mobile/core/contants/url_config.dart';
import 'package:frontend_mobile/core/theme/app_color.dart';
import 'package:frontend_mobile/features/checkout/presentation/view/checkout_args.dart';
import 'package:frontend_mobile/features/checkout/presentation/viewmodels/checkout_state.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

class VnpayWebviewPage extends StatefulWidget {
  const VnpayWebviewPage({super.key, required this.args});

  final VnpayArgs args;

  @override
  State<VnpayWebviewPage> createState() => _VnpayWebviewPageState();
}

class _VnpayWebviewPageState extends State<VnpayWebviewPage> {
  bool _isLoading = true;
  late final WebViewController _controller;

  static const String kReturnUrlPrefix =
      '${UrlConfig.backendBaseUrl}/payment-result';

  @override
  void initState() {
    super.initState();

    debugPrint('>>> [VNPay] paymentUrl = ${widget.args.paymentUrl}');
    debugPrint('>>> [VNPay] returnUrlPrefix = $kReturnUrlPrefix');

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            final url = request.url;
            debugPrint('>>> [VNPay] onNavigationRequest: $url');

            if (url.startsWith(kReturnUrlPrefix)) {
              final uri = Uri.parse(url);
              final status = uri.queryParameters['vnp_status'] ?? 'error';
              final orderId =
                  uri.queryParameters['order_id'] ?? widget.args.orderId;

              debugPrint(
                '>>> [VNPay] matched returnUrl, status=$status, orderId=$orderId',
              );

              if (mounted) {
                context.go(
                  '/payment-result',
                  extra: PaymentResultArgs(
                    status: status,
                    orderId: orderId,
                    method: PaymentMethodMobile.vnpay,
                  ),
                );
              }

              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
          onPageStarted: (url) {
            debugPrint('>>> [VNPay] onPageStarted: $url');
            setState(() => _isLoading = true);
          },
          onPageFinished: (url) {
            debugPrint('>>> [VNPay] onPageFinished: $url');
            setState(() => _isLoading = false);
          },
          onWebResourceError: (error) {
            debugPrint(
              '>>> [VNPay] ERROR: ${error.errorType} - ${error.description}',
            );
            setState(() => _isLoading = false);
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.args.paymentUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        foregroundColor: Colors.white,
        backgroundColor: AppColor.buttonprimaryCol,
        title: const Text('Thanh toán VNPay', style: TextStyle(fontWeight: FontWeight.w600),),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
