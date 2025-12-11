/* eslint-disable @typescript-eslint/no-explicit-any */

import { API } from "@/app/lib/axios-client";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import { useCatalog } from "@/hooks/use-catalog";
import { Footer } from "@/modules/user/components/Footer";
import { Divider } from "antd";
import { Divide } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

export const AuthLayout = () => {

    return (
        // STACK (Cha)
        // 1. Thêm 'overflow-hidden': Để cắt bỏ bất kỳ phần nào của TextEffect bị lòi ra ngoài
        // 2. Thêm 'bg-black' (nếu TextEffect của bạn cần nền tối mới đẹp)
        <div className="min-h-screen w-full relative flex flex-col overflow-hidden bg-background">

            {/* === LỚP 1: BACKGROUND === */}
            {/* Thêm flex items-center justify-center để cái TextEffect luôn nằm giữa màn hình */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                {/* - Bỏ 'h-[300px]' cứng để tránh việc nó chiếm chỗ không cần thiết.
           - Nếu muốn chữ to hơn/nhỏ hơn, hãy chỉnh trực tiếp height ở đây, ví dụ h-[40vh].
        */}
                <div className="w-full h-[40vh] flex items-center justify-center">
                    <TextHoverEffect text="Glasses" />
                </div>
            </div>

            {/* === LỚP 2: CONTENT === */}
            <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">

                {/* Phần Outlet Container */}
                {/* 2. Thẻ Flex-1 này vẫn chiếm hết chỗ để căn giữa, nhưng vẫn phải CHO CHUỘT XUYÊN QUA (none) */}
                <div className="flex-1 flex items-center justify-center py-10 pointer-events-none">

                    {/* === MẤU CHỐT LÀ Ở ĐÂY === */}
                    {/* 3. Tạo một cái hộp bao quanh Outlet. 
               Hộp này mới là thứ BẮT SỰ KIỆN CHUỘT (auto).
               Nó chỉ to bằng đúng cái Form thôi, không che phần nền thừa ra.
        */}
                    <div className="pointer-events-auto w-full max-w-md">
                        <Outlet />
                    </div>

                </div>

                {/* Footer: Cần bấm được link nên phải là auto */}
                <div className="pointer-events-auto">
                    <Footer />
                </div>
            </div>
        </div>
    );
};