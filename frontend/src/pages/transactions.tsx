import ModeToggle from "@/components/ui/mode-toggle";
import { formatDate } from "@/helpers/formatDate";
import { formatNumber } from "@/helpers/formatNumber";
import { useTransactions } from "@/hooks";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const statusStyles: Record<string, string> = {
  success: "text-green-600 dark:text-green-400",
  pending: "text-amber-600 dark:text-amber-400",
  failed: "text-red-600 dark:text-red-400",
};

export default function Transactions() {
  const { transactions, isLoading, fetchTransactions } = useTransactions();

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="min-h-dvh py-20">
      <div className="fixed top-4 right-4">
        <ModeToggle />
      </div>
      <div className="max-w-2xl mx-auto w-[90%] space-y-6">
        <div className="space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary"
          >
            <ArrowLeftIcon size={16} />
            Back to wallet
          </Link>
          <h2 className="text-2xl font-semibold">Transactions</h2>
          <p className="text-sm text-muted">Your payment history</p>
        </div>

        {isLoading && (
          <p className="text-sm text-muted text-center py-8">Loading...</p>
        )}

        {!isLoading && transactions.length === 0 && (
          <p className="text-sm text-muted text-center py-8 border border-line rounded-xl">
            No transactions yet
          </p>
        )}

        {!isLoading && transactions.length > 0 && (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="border border-line rounded-xl p-4 space-y-2 bg-background"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">NGN {formatNumber(tx.amount)}</p>
                  <span
                    className={`text-xs font-medium capitalize ${statusStyles[tx.status] ?? ""}`}
                  >
                    {tx.status}
                  </span>
                </div>
                <p className="text-xs text-muted">{tx.description}</p>
                <p className="text-xs text-muted break-all">
                  Ref: {tx.reference}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(tx.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
