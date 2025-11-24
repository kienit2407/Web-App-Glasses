// src/service/payment.service.ts
import { Types } from "mongoose";
import crypto from "crypto";
import qs from "qs";

import { env } from "../../../config/environment";
import { Order } from "../../../models/orders.model";
import { Payment, IPayment, TPaymentProvider, TPaymentState } from "../../../models/payments.model";
import { getClientIp } from "../../../utils/getClientIp";
import { vnpay } from "../../../utils/vnpay";

interface VnpCreatePayload {
    userId: Types.ObjectId;
    orderId: string;
    returnUrl?: string;
    clientIp: string;
}

interface VnpParams {
    [key: string]: string;
}

export const paymentService = {
    // helper: tạo txnRef, có thể dùng payment._id
    generateTxnRef() {
        return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    },

    signVnpParams(params: VnpParams) {
        // 1. Sort key
        const sortedKeys = Object.keys(params).sort();

        // 2. Encode từng value giống PHP urlencode (space -> +)
        const encoded: VnpParams = {};
        for (const key of sortedKeys) {
            const raw = params[key];
            if (raw === undefined || raw === null || raw === "") continue;

            // encodeURIComponent rồi thay %20 -> +
            encoded[key] = encodeURIComponent(raw)
                .replace(/%20/g, "+")
                .replace(/\(/g, "%28")
                .replace(/\)/g, "%29"); // phòng xa, không bắt buộc nhưng an toàn
        }

        // 3. Ghép signData: key=encodedValue&key2=encodedValue2...
        const signData = sortedKeys
            .filter((k) => encoded[k] !== undefined)
            .map((k) => `${k}=${encoded[k]}`)
            .join("&");

        const secret = env.VNP_HASH_SECRET.trim();
        const hmac = crypto.createHmac("sha512", secret);
        const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

        console.log("VNP signData =", signData);
        console.log("VNP signed =", signed);

        // trả luôn object đã ENCODE, vì sẽ dùng để build URL
        return { sorted: encoded, signed };
    },
    async createVnpPaymentUrl(payload: VnpCreatePayload) {
        const { userId, orderId, returnUrl, clientIp } = payload;

        if (!Types.ObjectId.isValid(orderId)) {
            throw new Error("Invalid order_id");
        }

        const order = await Order.findOne({
            _id: orderId,
            user_id: userId,
        });

        if (!order) {
            throw new Error("Order not found");
        }

        if (order.payment_status !== "pending") {
            throw new Error("Order is not in pending payment status");
        }

        const amount = order.total_amount;
        if (amount <= 0) {
            throw new Error("Order total_amount must be greater than 0");
        }

        // tạo Payment record (pending)
        const txnRef = this.generateTxnRef();

        const payment = await Payment.create({
            user_id: userId,
            order_id: order._id,
            provider: "vnpay",
            amount,
            status: "pending",
            vnp_txn_ref: txnRef,
            metadata: {
                returnUrlOverride: returnUrl || null,
            },
        });

        // const createDate = new Date();
        // const vnpCreateDate = createDate
        //     .toISOString()
        //     .replace(/[-T:\.Z]/g, "")
        //     .slice(0, 14)

        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: amount, // 
            vnp_IpAddr: clientIp || "127.0.0.1",
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Thanh toan don hang ${order.order_number}`,
            vnp_ReturnUrl: env.VNP_RETURN_URL
        });

        // const { sorted, signed } = this.signVnpParams(vnpParams);

        // const paymentUrl =
        //     env.VNP_URL +
        //     "?" +
        //     qs.stringify(sorted, { encode: false }) +
        //     `&vnp_SecureHash=${signed}`;

        return {
            paymentUrl,
            paymentId: payment._id,
            txnRef,
        };
    },

    // /vnpay/return: xử lý kết quả khi user được redirect về (browser)
    // /vnpay/return: xử lý kết quả khi user được redirect về (browser)
    async handleVnpReturn(rawQuery: any) {
        const verify = vnpay.verifyReturnUrl(rawQuery);

        if (!verify.isSuccess) {
            throw new Error(verify.message || "Invalid VNPAY return");
        }

        const vnp_TxnRef = verify.vnp_TxnRef;
        const vnp_ResponseCode = verify.vnp_ResponseCode;

        const payment = await Payment.findOne({ vnp_txn_ref: vnp_TxnRef });
        if (!payment) {
            throw new Error("Payment not found");
        }

        // quyết định trạng thái mới
        let status: TPaymentState = payment.status;
        if (vnp_ResponseCode === "00") status = "success";
        else status = "failed";

        // --- GÁN LUÔN VÀO PAYMENT (ép về string/undefined) ---
        payment.status = status;
        if (status === "success") {
            payment.paidAt = payment.paidAt || new Date();
        }

        payment.vnp_response_code =
            (verify.vnp_ResponseCode as string | undefined) ?? undefined;

        payment.vnp_bank_code =
            verify.vnp_BankCode !== undefined && verify.vnp_BankCode !== null
                ? String(verify.vnp_BankCode)
                : undefined;

        payment.vnp_bank_tran_no =
            verify.vnp_BankTranNo !== undefined && verify.vnp_BankTranNo !== null
                ? String(verify.vnp_BankTranNo)
                : undefined;

        payment.vnp_transaction_no =
            verify.vnp_TransactionNo !== undefined && verify.vnp_TransactionNo !== null
                ? String(verify.vnp_TransactionNo)
                : undefined;

        payment.vnp_pay_date =
            verify.vnp_PayDate !== undefined && verify.vnp_PayDate !== null
                ? String(verify.vnp_PayDate)
                : undefined;

        payment.vnp_secure_hash =
            verify.vnp_SecureHash !== undefined && verify.vnp_SecureHash !== null
                ? String(verify.vnp_SecureHash)
                : undefined;

        await payment.save();

        // update luôn order.payment_status cho dễ xem
        const order = await Order.findById(payment.order_id);
        if (order) {
            order.payment_status = status;
            await order.save();
        }

        return {
            orderId: payment.order_id,
            paymentId: payment._id,
            responseCode: vnp_ResponseCode,
            status,
        };
    },


    // /vnpay/ipn: nơi VNPAY gọi server-to-server để confirm
    async handleVnpIpn(rawQuery: any) {
        const verify = vnpay.verifyIpnCall(rawQuery);

        if (!verify.isSuccess) {
            return { RspCode: "97", Message: verify.message || "Invalid signature" };
        }

        const vnp_TxnRef = verify.vnp_TxnRef;
        const vnp_ResponseCode = verify.vnp_ResponseCode;
        const vnp_Amount = Number(verify.vnp_Amount || 0) / 100;

        if (!vnp_TxnRef) {
            return { RspCode: "01", Message: "Missing vnp_TxnRef" };
        }

        const payment = await Payment.findOne({ vnp_txn_ref: vnp_TxnRef });
        if (!payment) {
            return { RspCode: "01", Message: "Payment not found" };
        }

        if (payment.amount !== vnp_Amount) {
            return { RspCode: "04", Message: "Invalid amount" };
        }

        if (payment.status === "success") {
            return { RspCode: "00", Message: "Payment already confirmed" };
        }


        let newStatus: TPaymentState = "failed";
        if (vnp_ResponseCode === "00") {
            newStatus = "success";
        }

        payment.status = newStatus;
        payment.vnp_bank_code = verify.vnp_BankCode ? String(verify.vnp_BankCode) : undefined;
        payment.vnp_bank_tran_no = verify.vnp_BankTranNo ? String(verify.vnp_BankTranNo) : undefined;
        payment.vnp_pay_date = verify.vnp_PayDate ? String(verify.vnp_PayDate) : undefined;
        payment.vnp_response_code = verify.vnp_ResponseCode ? String(verify.vnp_ResponseCode) : undefined;
        payment.vnp_transaction_no = verify.vnp_TransactionNo ? String(verify.vnp_TransactionNo) : undefined;
        payment.vnp_secure_hash = verify.vnp_SecureHash ? String(verify.vnp_SecureHash) : undefined;
        payment.paidAt = newStatus === "success" ? new Date() : undefined;
        await payment.save();

        // ✅ Update order.payment_status, nhưng KHÔNG TỰ Ý đổi order_status
        const order = await Order.findById(payment.order_id);
        if (order) {
            if (newStatus === "success") {
                order.payment_status = "success";
                // order.order_status vẫn "pending" -> admin sẽ xác nhận sau
            } else if (newStatus === "failed") {
                order.payment_status = "failed";
            }
            await order.save();
        }

        return { RspCode: "00", Message: "Confirm success" };
    },

    // COD: confirm đặt hàng với phương thức COD
    async codConfirm(userId: Types.ObjectId, orderId: string) {
        if (!Types.ObjectId.isValid(orderId)) {
            throw new Error("Invalid order_id");
        }

        const order = await Order.findOne({
            _id: orderId,
            user_id: userId,
        });

        if (!order) {
            throw new Error("Order not found");
        }

        if (order.payment_status !== "pending") {
            throw new Error("Order is not in pending payment status");
        }

        const amount = order.total_amount;

        const payment = await Payment.create({
            user_id: userId,
            order_id: order._id,
            provider: "cod",
            amount,
            status: "pending", // COD: chờ giao xong mới success
        });

        await order.save(); // nếu không sửa gì thì thậm chí có thể bỏ luôn dòng này

        return payment;
    }
};
