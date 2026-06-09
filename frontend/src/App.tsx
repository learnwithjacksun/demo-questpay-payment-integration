import ProtectedRoute from "@/components/ProtectedRoute";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { ScrollToTop } from "@/components/ui";
import { Home, PaymentCallback, Transactions } from "@/pages";
import { Login, Signup } from "@/pages/auth";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" richColors />
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
      </Routes>
    </>
  );
}
