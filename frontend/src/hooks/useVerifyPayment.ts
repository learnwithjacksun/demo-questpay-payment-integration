import api from "@/config/api";
import { useCallback, useState } from "react";

type VerifyResult = {
  success: boolean;
  message: string;
  status?: string;
  transaction?: {
    reference: string;
    amount: number;
    email: string;
    status: string;
  };
};

export default function useVerifyPayment() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const verifyPayment = useCallback(async (reference: string) => {
    setIsVerifying(true);
    try {
      const { data } = await api.get(`/payments/verify/${reference}`);
      setResult(data);
      return data as VerifyResult;
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Failed to verify payment";
      const failed: VerifyResult = {
        success: false,
        message,
        status: "failed",
      };
      setResult(failed);
      return failed;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  return {
    verifyPayment,
    isVerifying,
    result,
  };
}
