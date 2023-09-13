import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmailConfirmation from "./pages/VerifyEmailConfirmation";
import VerifyEmail from "./pages/VerifyEmail";
import Error from "./pages/Error";
import LoadCredits from "./pages/LoadCredits";
import CreditCard from "./pages/CreditCard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import AccountSettings from "./pages/AccountSettings";
import CreditHistory from "./pages/CreditHistory";
import OrderLabel from "./pages/OrderLabel";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/users/:id/verify/:token"
          element={<VerifyEmailConfirmation />}
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/account/change-username"
          element={<AccountSettings currentPage="username" />}
        />
        <Route
          path="/account/change-email"
          element={<AccountSettings currentPage="email" />}
        />
        <Route
          path="/account/change-password"
          element={<AccountSettings currentPage="password" />}
        />
        <Route path="/load-credits" element={<LoadCredits />} />
        <Route path="/pay/credit-card" element={<CreditCard />} />
        <Route path="/credit-history" element={<CreditHistory />} />
        <Route path="/order-label" element={<OrderLabel />} />
        <Route path="*" element={<Error />} />
      </Routes>
    </BrowserRouter>
  );
}
