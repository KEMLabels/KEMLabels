import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoArrowLeft } from "react-icons/go";
import axios from "../api/axios";
import "../styles/Global.css";
import "../styles/Auth.css";
import Button from "../components/Button";
import { InputField, PasswordField } from "../components/Field";
import PageLayout from "../components/PageLayout";
import AlertMessage from "../components/AlertMessage";
import {
  setUserCreditAmount,
  setUserEmail,
  setUserJoinedDate,
  setUserLoadAmount,
  setUserLoggedIn,
  setUserName,
  setUserVerified,
} from "../redux/actions/UserAction";
import {
  validateEmailOnSubmit,
  validatePasswordOnSubmit,
  validateUsernameOnSubmit,
} from "../utils/Validation";
import {
  getCurrDateTimeInISO,
  validatePasswordOnTyping,
} from "../utils/Helpers";
import Log from "../components/Log";

export default function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [inputUserName, setInputUserName] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [passwordValid, setPasswordValid] = useState({
    length: true,
    uppercase: true,
    number: true,
    specialChar: true,
  });

  useEffect(() => {
    if (isLoggedIn) navigate("/verify-email");
  }, [isLoggedIn, navigate]);

  // Validate all fields before submitting
  function validateFields() {
    // empty field validation
    if (inputUserName === "" || inputEmail === "" || inputPassword === "") {
      setErrMsg("Please fill out all fields.");
      return false;
    }

    // username, email, password validation
    if (
      !validateUsernameOnSubmit(inputUserName, setErrMsg) ||
      !validateEmailOnSubmit(inputEmail, setErrMsg) ||
      !validatePasswordOnSubmit(inputPassword, setErrMsg)
    ) {
      return false;
    }
    return true;
  }

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateFields()) {
      setLoading(false);
      return;
    }

    axios
      .post(
        "/Signup",
        { userName: inputUserName, email: inputEmail, password: inputPassword },
        { withCredentials: true }
      )
      .then((res) => {
        Log(res);
        if (res.data.errMsg) setErrMsg(res.data.errMsg);
        else {
          dispatch(setUserName(inputUserName));
          dispatch(setUserEmail(inputEmail));
          dispatch(setUserCreditAmount(0));
          dispatch(setUserLoadAmount(0));
          dispatch(setUserJoinedDate(getCurrDateTimeInISO()));
          dispatch(setUserVerified(false));
          dispatch(setUserLoggedIn(true));
        }
      })
      .catch((e) => {
        Log("Error: ", e);
        if (
          e?.response?.data?.msg ===
            "This username is already associated with an account." ||
          e?.response?.data?.msg ===
            "This email is already associated with an account."
        ) {
          setErrMsg(e.response.data.msg);
        } else {
          setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <PageLayout
      title="Sign Up"
      description="Sign Up with KEMLabels - Join our community of shippers and start your joruney. Create an account to order shipping labels, track your credit history, and more. Get started with KEMLabels today!"
      hideNavAndFooter
    >
      <div className="authContainer">
        <div className="authColumn">
          <div className="backToHome">
            <Link to="/" className="link">
              <GoArrowLeft size={18} style={{ marginTop: "2px" }} />
              <p>Back to Home</p>
            </Link>
          </div>
          <div className="authHeader">
            <h1>Create an account</h1>
            <p>
              <span>Let's get started with a free account.</span>
            </p>
          </div>
          {errMsg && <AlertMessage msg={errMsg} type="error" />}
          <form action="POST" className="authFormContainer">
            <InputField
              label="Username"
              onChangeEvent={(e) => {
                setInputUserName(e.target.value.trim().toLowerCase());
                setErrMsg("");
              }}
              placeholder="johndoe"
              minLength={3}
              maxLength={15}
            />
            <InputField
              label="Email"
              fieldType="email"
              onChangeEvent={(e) => {
                setInputEmail(e.target.value.trim().toLowerCase());
                setErrMsg("");
              }}
              placeholder="johndoe@gmail.com"
              minLength={3}
              maxLength={100}
            />
            <PasswordField
              label="Password"
              onChangeEvent={(e) => {
                setInputPassword(e.target.value.trim());
                validatePasswordOnTyping(
                  e.target.value.trim(),
                  setPasswordValid
                );
                setErrMsg("");
              }}
              minLength={8}
              maxLength={50}
            />
            <div className="passwordRequirements">
              <p>Password must include:</p>
              <ul>
                <li className={passwordValid.length ? "" : "invalidPassword"}>
                  8 - 50 characters
                </li>
                <li
                  className={passwordValid.uppercase ? "" : "invalidPassword"}
                >
                  1 uppercase letter
                </li>
                <li className={passwordValid.number ? "" : "invalidPassword"}>
                  1 number
                </li>
                <li
                  className={passwordValid.specialChar ? "" : "invalidPassword"}
                >
                  1 special character
                </li>
              </ul>
            </div>
            <Button
              btnType="submit"
              onClickEvent={submit}
              loading={loading}
              text="Create account"
            />
            <p className="disclaimer">
              By signing up to create an account I accept KEMLabel's{" "}
              <Link className="link" to="/terms-and-conditions">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link className="link" to="/privacy-policy">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
          <div style={{ width: "100%", textAlign: "center" }}>
            <span style={{ opacity: 0.5 }}>Already have an account? </span>
            <Link to="/signin" className="link">
              Sign In
            </Link>
          </div>
        </div>
        <div className="authColumn">
          <img
            src="/media/signup.jpg"
            width="100%"
            alt="Illustration of a man signing up by unlocking lock with a key."
          />
        </div>
      </div>
    </PageLayout>
  );
}
