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
  setUserEmail,
  setUserJoinedDate,
  setUserLoggedIn,
  setUserName,
} from "../redux/actions/UserAction";
import {
  lengthRangeCheck,
  validateEmailOnSubmit,
  validatePasswordNumber,
  validatePasswordOnSubmit,
  validatePasswordSpecialChar,
  validatePasswordUppercase,
  validateUsernameOnSubmit,
} from "../utils/Validation";
import { getCurrDateTimeInISO } from "../utils/Helpers";

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
    if (isLoggedIn) navigate("/verifyemail");
  }, [isLoggedIn, navigate]);

  // Validate password field during input change
  function validatePasswordOnTyping(password) {
    const passwordValid = {
      length: lengthRangeCheck(password, 8, 50),
      uppercase: validatePasswordUppercase(password),
      number: validatePasswordNumber(password),
      specialChar: validatePasswordSpecialChar(password),
    };
    setPasswordValid(passwordValid);
  }

  // Validate all fields before submitting
  function validateFields() {
    // empty field validation
    if (inputUserName === "" || inputEmail === "" || inputPassword === "") {
      setErrMsg("All fields are required.");
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
        console.log(res);
        if (res.data.errMsg) setErrMsg(res.data.errMsg);
        else {
          dispatch(setUserName(inputUserName));
          dispatch(setUserJoinedDate(getCurrDateTimeInISO()));
          dispatch(setUserEmail(inputEmail));
          dispatch(setUserLoggedIn(true));
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
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
    <PageLayout title="Sign Up" hideNavAndFooter>
      <div className="authContainer">
        <div className="authColumn">
          <div className="backToHome">
            <Link to="/" className="link">
              <GoArrowLeft size={18} style={{ marginTop: "2px" }} />
              <p>Return to Home</p>
            </Link>
          </div>
          <div className="authHeader">
            <h1>Create an account</h1>
            <p>Let's get started with a free account.</p>
          </div>
          {errMsg && <AlertMessage msg={errMsg} type="error" />}
          <form action="POST" className="authFormContainer">
            <InputField
              onChangeEvent={(e) => {
                setInputUserName(e.target.value);
                setErrMsg("");
              }}
              placeholder="Username"
              minLength={3}
              maxLength={15}
            />
            <InputField
              fieldType="email"
              onChangeEvent={(e) => {
                setInputEmail(e.target.value);
                setErrMsg("");
              }}
              placeholder="Email"
              minLength={3}
              maxLength={100}
            />
            <PasswordField
              onChangeEvent={(e) => {
                setInputPassword(e.target.value);
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
              <Link className="link" to="/termsandconditions">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link className="link" to="/privacypolicy">
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
