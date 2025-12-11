// OAuthCallback.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";

const OAuthCallback = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const { setAccessToken, fetchMe } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(search);
        const accessToken = params.get("accessToken");
        const from = params.get("from") || "/";

        if (!accessToken) {
            navigate("/auth/login", { replace: true });
            return;
        }

        (async () => {
            setAccessToken(accessToken);
            try {
                await fetchMe();
            } finally {
                navigate(from, { replace: true });
            }
        })();
    }, [search, navigate, setAccessToken, fetchMe]);

    return (
        <div className="flex items-center justify-center h-screen">
            <Spinner />
        </div>
    );
};

export default OAuthCallback;
