import ModeToggle from "@/components/ui/mode-toggle";
import { formatNumber } from "@/helpers/formatNumber";
import { useVerifyPayment } from "@/hooks";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

const POLL_INTERVAL_MS = 5000;

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("ref") || "";
  const checkoutStatus = searchParams.get("checkout_status");
  const { verifyPayment, isVerifying, result } = useVerifyPayment();

  const redirectFailed = checkoutStatus === "failed";

  useEffect(() => {
    if (!reference || redirectFailed) return;

    const stopIfDone = (data: { success: boolean; status?: string }) => {
      if (data.success || data.status === "failed") {
        clearInterval(intervalId);
      }
    };

    void verifyPayment(reference).then(stopIfDone);

    const intervalId = setInterval(() => {
      void verifyPayment(reference).then(stopIfDone);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [reference, redirectFailed, verifyPayment]);

  const status = useMemo(() => {
    if (redirectFailed) return "failed";
    return result?.status ?? (isVerifying ? "pending" : undefined);
  }, [redirectFailed, result?.status, isVerifying]);

  return (
    <div className="min-h-dvh py-20">
      <div className="fixed top-4 right-4">
        <ModeToggle />
      </div>
      <div className="max-w-md mx-auto w-[90%] space-y-6 text-center">
        {!reference && (
          <>
            <XCircle className="mx-auto text-red-500" size={48} />
            <h2 className="text-xl font-semibold">Missing payment reference</h2>
            <p className="text-sm text-muted">
              Return here from Questpay checkout or check your payment link.
            </p>
          </>
        )}

        {reference && !redirectFailed && isVerifying && !result && (
          <>
            <Loader2 className="mx-auto animate-spin text-primary" size={48} />
            <h2 className="text-xl font-semibold">Verifying payment...</h2>
            <p className="text-sm text-muted">Reference: {reference}</p>
          </>
        )}

        {reference && status === "success" && (
          <>
            <CheckCircle2 className="mx-auto text-green-500" size={48} />
            <h2 className="text-xl font-semibold">Payment confirmed</h2>
            <p className="text-sm text-muted">{result?.message}</p>
            {result?.transaction && (
              <div className="border border-line rounded-xl p-4 text-left space-y-2">
                <p className="text-sm">
                  <span className="text-muted">Amount:</span> NGN{" "}
                  {formatNumber(result.transaction.amount)}
                </p>
                <p className="text-sm">
                  <span className="text-muted">Email:</span>{" "}
                  {result.transaction.email}
                </p>
                <p className="text-sm">
                  <span className="text-muted">Reference:</span>{" "}
                  {result.transaction.reference}
                </p>
              </div>
            )}
          </>
        )}

        {reference && status === "pending" && !redirectFailed && (
          <>
            {isVerifying ? (
              <Loader2 className="mx-auto animate-spin text-amber-500" size={48} />
            ) : (
              <Clock className="mx-auto text-amber-500" size={48} />
            )}
            <h2 className="text-xl font-semibold">Payment pending</h2>
            <p className="text-sm text-muted">
              {result?.message ?? "Waiting for confirmation"}. If you paid by
              bank transfer, confirmation can take a few minutes. This page will
              update automatically.
            </p>
            <p className="text-sm text-muted">Reference: {reference}</p>
          </>
        )}

        {reference && status === "failed" && (
          <>
            <XCircle className="mx-auto text-red-500" size={48} />
            <h2 className="text-xl font-semibold">Payment not completed</h2>
            <p className="text-sm text-muted">
              {redirectFailed
                ? "Checkout timed out or was cancelled. You can try again from your wallet."
                : result?.message}
            </p>
          </>
        )}

        <Link
          to="/"
          className="inline-block text-primary text-sm font-medium underline"
        >
          Back to wallet
        </Link>
      </div>
    </div>
  );
}
