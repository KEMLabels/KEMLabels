import React, { useEffect, useState } from "react";
import ReactGA from "react-ga4";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoArrowLeft } from "react-icons/go";
import axios from "../api/axios";
import "../styles/Global.css";
import "../styles/Auth.css";
import Button from "../components/Button";
import { DefaultField, PasswordField } from "../components/Field";
import PageLayout from "../components/PageLayout";
import AlertMessage from "../components/AlertMessage";
import { setUser } from "../redux/actions/UserAction";
import Log from "../components/Log";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      ReactGA.set({ userId: inputEmail });
      navigate("/");
    }
  }, [isLoggedIn, navigate, inputEmail]);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    if (inputEmail === "" || inputPassword === "") {
      setLoading(false);
      setErrMsg("Please fill out all fields.");
      return;
    }
    axios
      .post(
        "/auth/signin",
        { email: inputEmail, password: inputPassword },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.errMsg) setErrMsg(res.data.errMsg);
        else {
          dispatch(
            setUser(
              res.data.userInfo.username,
              inputEmail,
              res.data.userInfo.creditAmount,
              0,
              res.data.userInfo.joinedDate,
              true,
              res.data.userInfo.isVerified
            )
          );
          navigate(res.data.redirect);
        }
      })
      .catch((e) => {
        Log("Error: ", e);
        // if (e?.response?.data?.msg === "Incorrect email or password.") {
        //   setErrMsg(e.response.data.msg);
        // } else {
        //   setErrMsg("An unexpected error occurred. Please try again later."); // Axios default error
        // }
        setErrMsg(JSON.stringify(e.response));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <PageLayout
      title="Login"
      description="Login to Your KEMLabels Account - Access your account securely. Manage your account, order a shipping label, track your credit hisotry, and more with ease. Welcome back to KEMLabels!"
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
            <h1>Login</h1>
            <p>
              <span>Welcome back! Please enter your details.</span>
            </p>
          </div>

          {errMsg && <AlertMessage msg={errMsg} type="error" />}
          <form action="POST" className="authFormContainer">
            <DefaultField
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
                setErrMsg("");
              }}
              minLength={8}
              maxLength={50}
            />
            <Link to="/forgot-password" className="linkAlt">
              Forgot password?
            </Link>
            <Button
              btnType="submit"
              loading={loading}
              onClickEvent={submit}
              text="Sign in"
            />
            <p className="disclaimer">
              By continuing, you agree to KEMLabel's{" "}
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
            <span style={{ opacity: 0.5 }}>Don't have an account? </span>
            <Link to="/signup" className="link">
              Sign Up
            </Link>
          </div>
        </div>
        <div className="authColumn">
          <img
            src="/media/login.svg"
            width="100%"
            alt="Illustration of a man logging in to an app."
          />
        </div>
      </div>
    </PageLayout>
  );
}
