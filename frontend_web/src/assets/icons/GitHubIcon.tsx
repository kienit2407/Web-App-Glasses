import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

export const GitHubIcon = ({ size = 24, className = "" }: IconProps) => {
    return (
        <img
            src="/github.png"
            alt="GitHub Icon"
            className={className}
            width={size}   // Luôn set width/height để tránh nhảy layout (CLS)
            height={size}
            loading="lazy" // <--- QUAN TRỌNG: Chỉ tải khi người dùng cuộn tới nơi
            decoding="async" // <--- Giúp giải mã ảnh không chặn luồng chính (main thread)
        />
    );
};