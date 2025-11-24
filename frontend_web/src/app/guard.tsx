import { useAuth } from '@/hooks/use-auth'
import { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface GuardProps {
    children: ReactElement
}

export const RequireAuth = ({ children }: GuardProps) => {
    const { user } = useAuth()
    const location = useLocation() // lấy vị trí hiện tại đang cố đăng nhập

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    return children
}

export const RequireGuest = ({ children }: GuardProps) => {
    const { user } = useAuth();
    const location = useLocation();
    const from = (location.state)?.from?.pathname || "/";

    if (!user) return children;

    // Nếu là admin và tự vào /login từ trang chủ
    if (user.roles.includes("admin") && from === "/") {
        return <Navigate to="/admin" replace />;
    }

    // Còn lại: trả về đúng chỗ họ muốn vào lúc bị chặn
    return <Navigate to={from} replace />;
};

export const RequireAdmin = ({ children }: GuardProps) => {
    const { user } = useAuth()
    const location = useLocation()
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />
    }

    if (!user.roles.includes("admin")) {
        return <Navigate to="/" replace />
    }

    return children
}
