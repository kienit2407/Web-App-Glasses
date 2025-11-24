import { useAuth } from "@/hooks/use-auth";
import Home from "./Home";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();

  if (user?.roles?.includes("admin")) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Home />;
};

export default Index;
