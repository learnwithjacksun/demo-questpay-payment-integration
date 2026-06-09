import { ButtonWithLoader, InputWithoutIcon } from "@/components/ui";
import ModeToggle from "@/components/ui/mode-toggle";
import { formatNumber } from "@/helpers/formatNumber";
import { useAuth, usePayment } from "@/hooks";
import { paymentSchema, type PaymentSchema } from "@/schemas/form";
import { ArrowRightIcon, LogOutIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export default function Home() {
  const { user, logout } = useAuth();
  const { initiatePayment, isLoading } = usePayment();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentSchema>({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit = (data: PaymentSchema) => {
    initiatePayment(data.amount);
  };

  return (
    <div className="min-h-dvh py-20">
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1 text-sm text-muted hover:text-primary px-2 py-1"
          title="Log out"
        >
          <LogOutIcon size={16} />
        </button>
        <ModeToggle />
      </div>
      <div className="max-w-md mx-auto w-[90%] space-y-10">
        <div className="space-y-2">
          <h2 className="text-center text-2xl font-semibold">
            Questpay Payment Integration
          </h2>
          <p className="w-fit bg-amber-100 dark:bg-amber-200 text-sm font-medium mx-auto px-3 py-1 rounded-full text-amber-800">
            Demo
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted">{user?.email}</p>
          <h3 className="text-2xl font-semibold">
            NGN {formatNumber(user?.balance ?? 0)}
          </h3>
          <p className="text-sm text-muted">
            Your wallet balance. Top up via Questpay hosted checkout.
          </p>
          <div>
            <Link
              to="/transactions"
              className="flex items-center gap-2 text-primary text-sm font-medium underline"
            >
              See Transactions <ArrowRightIcon size={16} />
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="border border-line rounded-xl p-4 space-y-4 drop-shadow-xl bg-background"
        >
          <InputWithoutIcon
            label="Amount (NGN)"
            type="number"
            placeholder="Enter amount"
            className="bg-secondary dark:bg-secondary/20"
            {...register("amount", { valueAsNumber: true })}
            error={errors.amount?.message}
          />
          <ButtonWithLoader
            initialText="Pay Now"
            loadingText="Processing..."
            className="w-full h-11 btn-primary text-sm font-semibold rounded-lg mt-6"
            type="submit"
            loading={isLoading}
          />
        </form>
      </div>
    </div>
  );
}
