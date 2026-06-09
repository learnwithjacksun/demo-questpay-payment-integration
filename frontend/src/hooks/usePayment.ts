import api from "@/config/api";
import { useState } from "react";
import { toast } from "sonner";

export default function usePayment() {
  const [isLoading, setIsLoading] = useState(false);

  const initiatePayment = async (amount: number) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/payments/initiate", { amount });
      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      }
      return data;
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Failed to initiate payment";
      toast.error(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiatePayment,
    isLoading,
  };
}
