import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ReactGA from "react-ga";
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

// Initialize React Ga with your tracking ID
ReactGA.initialize("G-1C27763WQC");

export default function App() {
  const location = useLocation();
  useEffect(() => {
    ReactGA.pageview(location.pathname + location.search);
  }, [location]);

  return (
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
  );
}
