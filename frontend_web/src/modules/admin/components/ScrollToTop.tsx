import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Mỗi khi đường dẫn (pathname) thay đổi
        // Cuộn màn hình lên toạ độ 0,0 ngay lập tức (không mượt, không animation)
        window.scrollTo(0, 0);
    }, [pathname]);

    return null; // Component này không render gì cả
};

export default ScrollToTop;