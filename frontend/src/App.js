import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AuthProvider from "./components/AuthProvider";
import VerifyEmail from "./pages/VerifyEmail";
import EmailVerificationPage from "./pages/EmailVerificationPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/signin" element={<Login />}></Route>
          <Route path="/signup" element={<Signup />}></Route>
          <Route path="/forgotpassword" element={<ForgotPassword />}></Route>
          <Route path="/users/:id/verify/:token" element={<VerifyEmail />}></Route>
          <Route path="/verifyemail" element={<EmailVerificationPage />}></Route>
          <Route path="*" element={<h1>404: Not Found</h1>}></Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
