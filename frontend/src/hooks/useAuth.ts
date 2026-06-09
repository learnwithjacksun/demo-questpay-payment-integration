import api from "@/config/api";
import useAuthStore, { type AuthUser } from "@/store/useAuthStore";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export default function useAuth() {
  const { token, user, setAuth, setUser, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const signup = async (email: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<{
        success: boolean;
        token: string;
        user: AuthUser;
        message?: string;
      }>("/auth/signup", { email });

      if (data.success && data.token) {
        setAuth(data.token, data.user);
        toast.success("Account created");
        return { success: true };
      }

      toast.error(data.message ?? "Signup failed");
      return { success: false };
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Signup failed";
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post<{
        success: boolean;
        token: string;
        user: AuthUser;
        message?: string;
      }>("/auth/login", { email });

      if (data.success && data.token) {
        setAuth(data.token, data.user);
        toast.success("Welcome back");
        return { success: true };
      }

      toast.error(data.message ?? "Login failed");
      return { success: false };
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Login failed";
      toast.error(message);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMe = useCallback(async () => {
    if (!useAuthStore.getState().token) return;
    try {
      const { data } = await api.get<{
        success: boolean;
        user: AuthUser;
      }>("/auth/me");
      if (data.success) {
        setUser(data.user);
      }
    } catch {
      clearAuth();
    }
  }, [setUser, clearAuth]);

  const logout = () => {
    clearAuth();
    toast.success("Logged out");
  };

  return {
    token,
    user,
    isLoading,
    signup,
    login,
    logout,
    fetchMe,
  };
}
