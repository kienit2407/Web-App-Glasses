import { Drawer } from "antd";
import type { ReactNode } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    children: ReactNode;
};

export const MobileActionSheet = ({ open, onClose, title, children }: Props) => {
    return (
        <Drawer
            placement="bottom"
            open={open}
            onClose={onClose}
            height="auto"
            title={title}
            bodyStyle={{ padding: 12 }}
        >
            {children}
        </Drawer>
    );
};
