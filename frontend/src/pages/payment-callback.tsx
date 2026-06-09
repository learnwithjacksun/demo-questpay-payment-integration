import ModeToggle from "@/components/ui/mode-toggle";
import { formatNumber } from "@/helpers/formatNumber";
import { useVerifyPayment } from "@/hooks";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

const POLL_INTERVAL_MS = 5000;

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("ref") || "";
  const { verifyPayment, isVerifying, result } = useVerifyPayment();

  useEffect(() => {

    if (!reference) return;

    const runVerify = async () => {
      const data = await verifyPayment(reference);
      if (data.success || data.status === "failed") {
        if (intervalId) clearInterval(intervalId);
      }
    };
    let intervalId = setInterval(runVerify, POLL_INTERVAL_MS);
    


    runVerify();
    intervalId = setInterval(runVerify, POLL_INTERVAL_MS);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [reference, verifyPayment]);

  const status = result?.status ?? (isVerifying ? "pending" : undefined);

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

        {reference && isVerifying && !result && (
          <>
            <Loader2 className="mx-auto animate-spin text-primary" size={48} />
            <h2 className="text-xl font-semibold">Verifying payment...</h2>
            <p className="text-sm text-muted">Reference: {reference}</p>
          </>
        )}

        {reference && result && status === "success" && (
          <>
            <CheckCircle2 className="mx-auto text-green-500" size={48} />
            <h2 className="text-xl font-semibold">Payment confirmed</h2>
            <p className="text-sm text-muted">{result.message}</p>
            {result.transaction && (
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

        {reference && result && status === "pending" && (
          <>
            {isVerifying ? (
              <Loader2 className="mx-auto animate-spin text-amber-500" size={48} />
            ) : (
              <Clock className="mx-auto text-amber-500" size={48} />
            )}
            <h2 className="text-xl font-semibold">Payment pending</h2>
            <p className="text-sm text-muted">
              {result.message}. If you paid by bank transfer, confirmation can
              take a few minutes. This page will update automatically.
            </p>
            <p className="text-sm text-muted">Reference: {reference}</p>
          </>
        )}

        {reference && result && status === "failed" && (
          <>
            <XCircle className="mx-auto text-red-500" size={48} />
            <h2 className="text-xl font-semibold">Payment not completed</h2>
            <p className="text-sm text-muted">{result.message}</p>
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
