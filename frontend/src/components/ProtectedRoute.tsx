import { useAuth } from "@/hooks";
import useAuthStore from "@/store/useAuthStore";
import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const { fetchMe } = useAuth();

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [token, fetchMe]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
