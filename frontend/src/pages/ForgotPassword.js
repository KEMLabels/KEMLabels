import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoArrowLeft } from "react-icons/go";
import { BiErrorCircle } from "react-icons/bi";
import VerificationInput from "react-verification-input";
import axios from "../api/axios";
import "../styles/Global.css";
import "../styles/Auth.css";
import Button from "../components/Button";
import { InputField, PasswordField } from "../components/Field";
import PageLayout from "../components/PageLayout";
import AlertMessage from "../components/AlertMessage";
import { setForgetPassEmailAttempts } from "../redux/actions/UserAction";

export default function ForgotPassword() {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const verifyForgetPassEmailState = useSelector(
    (state) => state.auth.verifyForgetPassEmail
  );

  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
  const [resentEmail, setResentEmail] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (
      verifyForgetPassEmailState &&
      verifyForgetPassEmailState.lastAttemptDateTime
    ) {
      const currentTime = Date.parse(getCurrentTimeInPST());
      const lastAttemptTime = Date.parse(
        verifyForgetPassEmailState.lastAttemptDateTime
      );
      const timeDifferenceInMinutes = Math.floor(
        Math.abs(currentTime - lastAttemptTime) / 1000 / 60
      );
      // if it has been 3 hours since the last attempt, reset the attempts
      if (timeDifferenceInMinutes >= 180) {
        dispatch(setForgetPassEmailAttempts(0, ""));
      }
    }
    if (isLoggedIn) {
      window.location.href = "/";
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, verifyForgetPassEmailState, dispatch]);

  function getCurrentTimeInPST() {
    const formatter = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Vancouver",
    });
    return formatter.format(new Date());
  }

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

  const sendVerificationCode = (e) => {
    e.preventDefault();
    setLoading(true);

    if (email === "") {
      setLoading(false);
      setErrMsg("All fields are required.");
      return;
    }
    axios
      .post("/emailExists", { email }, { withCredentials: true })
      .then((res) => {
        console.log(res.data);
        if (res.data.errMsg) setErrMsg(res.data.errMsg);
        else {
          sendInitialRequest();
          document.getElementById("resetPasswordForm").reset();
          setResetPasswordStep("verifyOTP");
          setInfoMsg("Email has been sent. Please check your inbox.");
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg(`${e.name}: ${e.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  function sendInitialRequest() {
    setResentEmail(true);
    if (verifyForgetPassEmailState.attempts === 10) {
      setErrMsg(
        "You have exceeded the maximum number of attempts. Please try again later."
      );
    } else {
      dispatch(
        setForgetPassEmailAttempts(
          verifyForgetPassEmailState.attempts + 1,
          getCurrentTimeInPST()
        )
      );
      setTimeout(() => {
        setResentEmail(false);
      }, 15000);
      axios
        .post("/forgotpassword", { email }, { withCredentials: true })
        .then((res) => {
          console.log(res.data);
        })
        .catch((e) => {
          console.log("Error: ", e);
          setErrMsg(`${e.name}: ${e.message}`);
        });
    }
  }

  function sendResetRequest(e) {
    e.preventDefault();
    setLoading(true);
    setResentEmail(true);
    if (verifyForgetPassEmailState.attempts === 10) {
      setLoading(false);
      setErrMsg(
        "You have exceeded the maximum number of attempts. Please try again later."
      );
    } else {
      dispatch(
        setForgetPassEmailAttempts(
          verifyForgetPassEmailState.attempts + 1,
          getCurrentTimeInPST()
        )
      );
      setTimeout(() => {
        setResentEmail(false);
        setLoading(false);
      }, 15000);
      axios
        .post("/generateNewOTP", { email }, { withCredentials: true })
        .then((res) => {
          console.log(res.data);
        })
        .catch((e) => {
          console.log("Error: ", e);
          setErrMsg(`${e.name}: ${e.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  const validateOTP = (e) => {
    e.preventDefault();
    setLoading(true);
    setInfoMsg("");

    axios
      .post("/checkOTP", { enteredOTP, email }, { withCredentials: true })
      .then((res) => {
        console.log(res);
        if (res.data.errMsg) {
          setErrMsg(res.data.errMsg);
        } else {
          document.getElementById("resetPasswordForm").reset();
          setResetPasswordStep("changePassword");
          setErrMsg("");
          setSuccessMsg("Verification successful.");
          setTimeout(() => {
            setSuccessMsg("");
          }, 5000);
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg(`${e.name}: ${e.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const changeUserPassword = (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    if (!validatePasswordOnSubmit(password)) {
      setLoading(false);
      return;
    }

    axios
      .post("/updateUserPass", { email, password }, { withCredentials: true })
      .then((res) => {
        console.log(res);
        if (res.data.errMsg) setErrMsg(res.data.errMsg);
        else {
          setRedirecting(true);
          setSuccessMsg(
            "Password updated successfully! Redirecting you to the login page..."
          );
          setTimeout(() => {
            setSuccessMsg("");
            window.location.href = res.data.redirect;
          }, 3000);
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg(`${e.name}: ${e.message}`);
      })
      .finally(() => {
        if (redirecting) {
          setTimeout(() => {
            setLoading(false);
          }, 3000);
        } else setLoading(false);
      });
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
            <div
              style={{
                display: "flex",
                marginTop: "1rem",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <Button
                fill="outline"
                onClickEvent={sendResetRequest}
                text="Resend email"
                disabled={resentEmail}
                loading={loading}
                customStyle={{
                  fontSize: "1rem",
                  fontWeight: "400",
                  padding: "6px 10px",
                }}
              />
              {resentEmail && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 300,
                    color: "#FF0033",
                    gap: "5px",
                  }}
                >
                  <BiErrorCircle size={18} color="#FF0033" />
                  Please wait to re-send another email
                </span>
              )}
            </div>
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
              loading={loading}
              text="Send verification code"
              customStyle={{ marginTop: "1rem" }}
            />
          </>
        );
      case "verifyOTP":
        return (
          <>
            <div className="otpContainer">
              <VerificationInput
                length={4}
                autoFocus
                placeholder="*"
                validChars="0-9"
                classNames={{
                  container: "otpInputContainer",
                  character: "otpText",
                  characterInactive: "inactiveText",
                  characterSelected: "selectedText",
                }}
                onChange={(value) => {
                  setEnteredOTP(value);
                  setErrMsg("");
                }}
              />
            </div>
            <Button
              btnType="submit"
              onClickEvent={validateOTP}
              loading={loading}
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
              loading={loading}
              text="Update password"
            />
          </>
        );
      default:
        return null;
    }
  }

  if (isLoading) return;
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
                <p>Back to login</p>
              </Link>
            </div>
          )}
          {renderHeading()}
          {successMsg && <AlertMessage msg={successMsg} type="success" />}
          {!errMsg && infoMsg && <AlertMessage msg={infoMsg} type="info" />}
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
