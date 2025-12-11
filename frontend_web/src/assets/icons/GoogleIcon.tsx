// import { LazyLoadImage } from 'react-lazy-load-image-component';
// import 'react-lazy-load-image-component/src/effects/blur.css'; // Import hiệu ứng mờ

// export const GoogleIcon = () => (
//     <LazyLoadImage
//         alt="My Image"
//         className=""
//         effect="blur" // Hiệu ứng mờ dần khi tải xong
//         src="/github.png"
//         height={50}
//         width={50}
//     />
// );
interface IconProps {
    size?: number;
    className?: string;
}

export const GoogleIcon = ({ size = 24, className = "" }: IconProps) => {
    return (
        <img
            src="/gg_logo.png"
            alt="GitHub Icon"
            className={className}
            width={size}   // Luôn set width/height để tránh nhảy layout (CLS)
            height={size}
            loading="lazy" // <--- QUAN TRỌNG: Chỉ tải khi người dùng cuộn tới nơi
            decoding="async" // <--- Giúp giải mã ảnh không chặn luồng chính (main thread)
        />
    );
};