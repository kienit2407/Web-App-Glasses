import React from "react";
import "./LiquidButton.css";
import { Sparkles } from "lucide-react";

export default function LiquidButton({ onClick, label = "Chat AI" }) {
  return (
    <button className="liquid-btn" onClick={onClick} type="button">
      {/* nền hiệu ứng (bị cắt gọn trong pill) */}
      <span className="liquid-clip" aria-hidden="true">
        <span className="liquid-aura aura-1" />
        <span className="liquid-aura aura-2" />
      </span>

      {/* nội dung */}
      <span className="liquid-content">
        <Sparkles size={18} />
        <span>{label}</span>
      </span>
    </button>
  );
}
