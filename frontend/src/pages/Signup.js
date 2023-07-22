import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoArrowLeft } from "react-icons/go";
import axios from "../api/axios";
import "../styles/Global.css";
import "../styles/Auth.css";
import Button from "../components/Button";
import { InputField, PasswordField } from "../components/Field";
import PageLayout from "../components/PageLayout";
import AlertMessage from "../components/AlertMessage";
import { setUserEmail, setUserLoggedIn } from "../redux/actions/AuthAction";

export default function Signup() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [isLoading, setIsLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordValid, setPasswordValid] = useState({
    length: true,
    uppercase: true,
    number: true,
    specialChar: true,
  });

  useEffect(() => {
    if (isLoggedIn) {
      window.location.href = "/";
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

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

  // Validate all fields before submitting
  function validateFields() {
    // regex
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    const emailRegex = /^([a-z0-9_.-]+)@([\da-z.-]+)\.([a-z.]{2,6})$/g;
    const passwordRegex =
      /^(?=.*[0-9])(?=.*[!@#$%^&*()\-_=+{}[\]|\\;:'",.<>/?`~])(?=.*[A-Z])(?=.*[a-z]).*$/;

    if (userName === "" || email === "" || password === "") {
      setErrMsg("All fields are required.");
      return false;
    }

    // username validation
    if (userName.length < 3 || userName.length > 50) {
      setErrMsg("Username must be between 3 and 50 characters.");
      return false;
    } else if (!usernameRegex.test(userName)) {
      setErrMsg(
        "Invalid username. Only alphabets, numbers, dash, underscores, and periods are allowed."
      );
      return false;
    }

    // email validation
    if (email.length < 3 || email.length > 100) {
      setErrMsg("Email must be between 3 and 100 characters.");
      return false;
    } else if (!emailRegex.test(email)) {
      setErrMsg("Invalid email.");
      return false;
    }

    // password validation
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

  const submit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;
    const res = await axios.post(
      "/Signup",
      { userName, email, password },
      { withCredentials: true }
    );
    if (res.data.errMsg) setErrMsg(res.data.errMsg);
    else {
      dispatch(setUserEmail(email));
      dispatch(setUserLoggedIn(true));
      axios
        .get("/checkVerification", { withCredentials: true })
        .then((res) => {
          if (res.data.errMsg) {
            window.location.href = "/verifyEmail";
          }
        })
        .catch((err) => console.log(err));
    }
  };

  if (isLoading) return;
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
                setUserName(e.target.value);
                setErrMsg("");
              }}
              placeholder="Username"
              minLength={3}
              maxLength={50}
            />
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
              onClickEvent={submit}
              text="Create account"
            />
          </form>
          <div style={{ width: "100%", textAlign: "center" }}>
            <span style={{ opacity: 0.5 }}>Already have an account? </span>
            <Link to="/signin" className="link">
              Sign In
            </Link>
          </div>
        </div>
        <div className="authColumn">
          {/* TODO: Replace graphic */}
          <img
            src="/media/hero.svg"
            width="100%"
            alt="Illustration of a delivery man."
          />
        </div>
      </div>
    </PageLayout>
  );
}
