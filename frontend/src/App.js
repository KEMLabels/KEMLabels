import React, { useLayoutEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import { isDevelopmentEnv } from "./utils/Helpers";
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

try {
  ReactGA.initialize("G-H5QKQJTFBG");
} catch (e) {
  console.error("Error initializing ReactGA: ", e);
}

export default function App() {
  const location = useLocation();
  useLayoutEffect(() => {
    // Avoid sending GA events in development
    if (isDevelopmentEnv()) return;
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname,
      title: document.title,
    });
  }, [location.pathname]);

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
