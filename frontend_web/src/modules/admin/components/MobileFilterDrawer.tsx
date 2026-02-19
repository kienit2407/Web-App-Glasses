import { Drawer } from "antd";
import type { ReactNode } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    children: ReactNode;
};

export const MobileFilterDrawer = ({ open, onClose, title, children }: Props) => {
    return (
        <Drawer
            placement="right"
            width={320}
            open={open}
            onClose={onClose}
            title={title ?? "Bộ lọc"}
            bodyStyle={{ padding: 12 }}
        >
            {children}
        </Drawer>
    );
};
