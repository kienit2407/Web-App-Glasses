import { useEffect, useState } from "react";
import { PromotionHighlightModal } from "./PromotionHighlightModal";

export const PromotionHighlightEntry = () => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        // khi component mount lần đầu -> mở modal
        setOpen(true);
    }, []);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <PromotionHighlightModal
            open={open}
            onClose={handleClose}
        />
    );
};
