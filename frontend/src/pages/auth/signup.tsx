import { ButtonWithLoader, InputWithoutIcon } from "@/components/ui";
import ModeToggle from "@/components/ui/mode-toggle";
import { useAuth } from "@/hooks";
import { authSchema, type AuthSchema } from "@/schemas/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthSchema>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthSchema) => {
    const result = await signup(data.email);
    if (result.success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-dvh py-20">
      <div className="fixed top-4 right-4">
        <ModeToggle />
      </div>
      <div className="max-w-md mx-auto w-[90%] space-y-10">
        <div className="space-y-2">
          <h2 className="text-center text-2xl font-semibold">Sign up</h2>
          <p className="text-center text-sm text-muted">
            Create an account with your email
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="border border-line rounded-xl p-4 space-y-4 drop-shadow-xl bg-background"
        >
          <InputWithoutIcon
            label="Email"
            type="email"
            placeholder="you@example.com"
            className="bg-secondary dark:bg-secondary/20"
            {...register("email")}
            error={errors.email?.message}
          />
          <ButtonWithLoader
            initialText="Create account"
            loadingText="Creating account..."
            className="w-full h-11 btn-primary text-sm font-semibold rounded-lg mt-6"
            type="submit"
            loading={isLoading}
          />
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
