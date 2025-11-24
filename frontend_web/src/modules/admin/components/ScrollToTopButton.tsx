import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

interface ScrollToTopButtonProps {
    /** Sau bao nhiêu px thì bắt đầu hiện nút (default: 300) */
    showAfter?: number;
}

const ScrollToTopButton = ({ showAfter = 300 }: ScrollToTopButtonProps) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            const scrollY = window.scrollY || document.documentElement.scrollTop;

            // dùng requestAnimationFrame cho đỡ spam setState
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setVisible(scrollY > showAfter);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", handleScroll);
        // chạy 1 lần để set trạng thái ban đầu (nếu mở ở giữa trang)
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [showAfter]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth", // cuộn mượt
        });
    };

    if (!visible) return null;

    return (
        <button
            onClick={scrollToTop}
            className="
        fixed bottom-6 right-6 z-50
        inline-flex items-center justify-center
        w-10 h-10 rounded-full
        bg-gradient-to-tr from-primary via-purple-500 to-pink-500 text-white
        shadow-xl
        hover:opacity-90
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-600
        transition
      "
            aria-label="Cuộn lên đầu trang"
        >
            <ArrowUp className="w-5 h-5" />
        </button>
    );
};

export default ScrollToTopButton;
