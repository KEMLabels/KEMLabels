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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/signin" element={<Login />}></Route>
        <Route path="/signup" element={<Signup />}></Route>
        <Route path="/forgotpassword" element={<ForgotPassword />}></Route>
        <Route
          path="/users/:id/verify/:token"
          element={<VerifyEmailConfirmation />}
        ></Route>
        <Route path="/verifyemail" element={<VerifyEmail />}></Route>
        <Route path="/loadcredits" element={<LoadCredits />}></Route>
        <Route path="/pay/creditcard" element={<CreditCard />}></Route>
        <Route path="*" element={<Error />}></Route>
      </Routes>
    </BrowserRouter>
  );
}
