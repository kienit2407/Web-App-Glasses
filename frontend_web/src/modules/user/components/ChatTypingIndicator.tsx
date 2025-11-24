// src/components/TypingDots.tsx
import React from "react";
import "./TypingDots.css";

type TypingDotsProps = {
    align?: "left" | "right"; // căn giống bong bóng chat
    label?: string;           // "Shop đang nhập..." / "Khách đang nhập..."
};

export const TypingDots: React.FC<TypingDotsProps> = ({
    align = "left",
    label = "Đang nhập...",
}) => {
    const isRight = align === "right";

    return (
        <div
            className={`flex my-1 ${isRight ? "justify-end" : "justify-start"}`}
        >
            <div
                className={`
          inline-flex items-center gap-1 px-3 py-2 rounded-2xl text-xs shadow-sm
          ${isRight ? "bg-blue-500/10 text-gray-700 rounded-br-sm" : "bg-gray-100 text-gray-700 rounded-bl-sm"}
        `}
            >
                <span>{label}</span>
                <span className="flex gap-1 ml-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                </span>
            </div>
        </div>
    );
};
