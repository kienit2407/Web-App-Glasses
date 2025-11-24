// src/constants/frame-shapes.ts
export const FRAME_SHAPES = [
    { value: "square", label: "Vuông" },
    { value: "rectangle", label: "Chữ nhật" },
    { value: "round", label: "Tròn" },
    { value: "browline", label: "Browline" },
    { value: "oval", label: "Oval" },
    { value: "polygon", label: "Đa giác" },
    { value: "cat-eye", label: "Mắt mèo" },
    { value: "pilot", label: "Phi công" },
    { value: "sport", label: "Thể thao" },
] as const;

export type FrameShapeValue = (typeof FRAME_SHAPES)[number]["value"];
