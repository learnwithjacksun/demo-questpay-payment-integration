import api from "@/config/api";
import { useCallback, useState } from "react";

export type Transaction = {
  id: string;
  reference: string;
  amount: number;
  status: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
};

export default function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<{
        success: boolean;
        transactions: Transaction[];
      }>("/transactions");
      if (data.success) {
        setTransactions(data.transactions);
      }
      return data.transactions;
    } catch {
      setTransactions([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    transactions,
    isLoading,
    fetchTransactions,
  };
}
