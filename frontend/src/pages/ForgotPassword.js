import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GoArrowLeft } from "react-icons/go";
import axios from "../api/axios";
import "../styles/Global.css";
import "../styles/Auth.css";
import Button from "../components/Button";
import { InputField, PasswordField } from "../components/Field";
import PageLayout from "../components/PageLayout";
import AlertMessage from "../components/alertMessage";

export default function ForgotPassword() {
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [resetPasswordStep, setResetPasswordStep] = useState("verifyEmail");
  const [email, setEmail] = useState("");
  const [enteredOTP, setEnteredOTP] = useState("");
  const [password, setPassword] = useState("");
  const [passwordValid, setPasswordValid] = useState({
    length: true,
    uppercase: true,
    number: true,
    specialChar: true,
  });

  // Validate password field during input change
  function validatePasswordOnTyping(password) {
    const passwordValid = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*()\-_=+{}[\]|\\;:'",.<>/?`~]/.test(password),
    };
    setPasswordValid(passwordValid);
  }

  // Validate password on submit
  function validatePasswordOnSubmit(password) {
    const passwordRegex =
      /^(?=.*[0-9])(?=.*[!@#$%^&*()\-_=+{}[\]|\\;:'",.<>/?`~])(?=.*[A-Z])(?=.*[a-z]).*$/;
    if (password.length < 8 || password.length > 50) {
      setErrMsg("Password must be between 8 and 50 characters.");
      return false;
    } else if (!passwordRegex.test(password)) {
      setErrMsg(
        "Password must contain at least one uppercase letter, one number, and one special character."
      );
      return false;
    }
    return true;
  }

  const sendVerificationCode = async (e) => {
    e.preventDefault();
    if (email === "") {
      setErrMsg("All fields are required.");
      return;
    }
    const res = await axios.post(
      "/emailExists",
      { email },
      { withCredentials: true }
    );
    console.log(res.data);
    if (res.data.errMsg) setErrMsg(res.data.errMsg);
    else {
      sendResetRequest();
      document.getElementById("resetPasswordForm").reset();
      setResetPasswordStep("verifyOTP");
      setInfoMsg("Email has been sent. Please check your inbox.");
      setTimeout(() => {
        setInfoMsg("");
      }, 2000);
    }
  };

  async function sendResetRequest() {
    const res = await axios.post(
      "/forgotpassword",
      { email },
      { withCredentials: true }
    );
    console.log(res.data);
  }

  const validateOTP = async (e) => {
    e.preventDefault();
    const res = await axios.post(
      "/checkOTP",
      { enteredOTP },
      { withCredentials: true }
    );
    console.log(res.data.errMsg);
    if (res.data.errMsg) setErrMsg(res.data.errMsg);
    else {
      document.getElementById("resetPasswordForm").reset();
      setResetPasswordStep("changePassword");
      setSuccessMsg("Verification successful.");
      setTimeout(() => {
        setSuccessMsg("");
      }, 2000);
    }
  };

  const changeUserPassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordOnSubmit(password)) return;
    const res = await axios.post(
      "/updateUserPass",
      { email, password },
      { withCredentials: true }
    );
    if (res.data.errMsg) setErrMsg(res.data.errMsg);
    else {
      setSuccessMsg("Password updated successfully.");
      setTimeout(() => {
        setSuccessMsg("");
        window.location.href = res.data.redirect;
      }, 2000);
    }
  };

  function renderHeading() {
    switch (resetPasswordStep) {
      case "verifyEmail":
        return (
          <div className="authHeader">
            <h1>Forgot password?</h1>
            <p>
              No worries, we will send you instructions to reset your password
              to your email.
            </p>
          </div>
        );
      case "verifyOTP":
        return (
          <div className="authHeader">
            <h1>Verify code</h1>
            <p>Please enter the 4 digit code from your email.</p>
            {/* TODO: Set timeout so users dont spam, and only show this when verification code is sent */}
            <Button
              fill="outline"
              onClickEvent={sendResetRequest}
              text="Resend email"
              customStyle={{
                fontSize: "1rem",
                fontWeight: "400",
                padding: "6px 10px",
                marginTop: "1rem",
              }}
            />
          </div>
        );
      case "changePassword":
        return (
          <div className="authHeader">
            <h1>Update password</h1>
            <p>Almost done! Please enter your new password.</p>
          </div>
        );
      default:
        return null;
    }
  }

  function renderForm() {
    switch (resetPasswordStep) {
      case "verifyEmail":
        return (
          <>
            <InputField
              fieldType="email"
              onChangeEvent={(e) => {
                setEmail(e.target.value);
                setErrMsg("");
              }}
              placeholder="Email"
              minLength={3}
              maxLength={100}
            />
            <Button
              btnType="submit"
              onClickEvent={sendVerificationCode}
              text="Send verification code"
              customStyle={{ marginTop: "1rem" }}
            />
          </>
        );
      case "verifyOTP":
        return (
          <>
            <InputField
              onChangeEvent={(e) => {
                setEnteredOTP(e.target.value);
                setErrMsg("");
              }}
              minLength={0}
              maxLength={9999}
              placeholder="Verification code"
            />
            <Button
              btnType="submit"
              onClickEvent={validateOTP}
              text="Enter code"
              customStyle={{ marginTop: "1rem" }}
            />
          </>
        );
      case "changePassword":
        return (
          <>
            <PasswordField
              onChangeEvent={(e) => {
                setPassword(e.target.value);
                validatePasswordOnTyping(e.target.value);
                setErrMsg("");
              }}
              placeholder="Password"
              minLength={8}
              maxLength={50}
            />
            <div className="passwordRequirements">
              <p>Password must include:</p>
              <ul>
                <li className={passwordValid.length ? "" : "invalidPassword"}>
                  At least 8 characters
                </li>
                <li
                  className={passwordValid.uppercase ? "" : "invalidPassword"}
                >
                  At least 1 uppercase letter
                </li>
                <li className={passwordValid.number ? "" : "invalidPassword"}>
                  At least 1 number
                </li>
                <li
                  className={passwordValid.specialChar ? "" : "invalidPassword"}
                >
                  At least 1 special character
                </li>
              </ul>
            </div>
            <Button
              btnType="submit"
              onClickEvent={changeUserPassword}
              text="Update password"
            />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <PageLayout title="Forgot Password">
      <div
        className="authContainer"
        style={{
          minHeight: "auto",
          justifyContent: "center",
          paddingTop: "5rem",
        }}
      >
        <div className="authColumn">
          {resetPasswordStep === "verifyEmail" && (
            <div className="backToHome">
              <Link to="/signin" className="link">
                <GoArrowLeft size={18} style={{ marginTop: "2px" }} />
                <p>Go back</p>
              </Link>
            </div>
          )}
          {renderHeading()}
          {successMsg && <AlertMessage msg={successMsg} type="success" />}
          {infoMsg && <AlertMessage msg={infoMsg} type="info" />}
          {errMsg && <AlertMessage msg={errMsg} type="error" />}

          <form
            action="POST"
            className="authFormContainer"
            id="resetPasswordForm"
          >
            {renderForm()}
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
