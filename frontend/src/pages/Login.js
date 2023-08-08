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
} from "../redux/actions/UserAction";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      axios
        .get("/checkVerification", {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.errMsg) navigate("/verifyemail");
          else navigate(res.data.redirect);
        })
        .catch((e) => {
          console.log("Error: ", e);
          if (e?.response?.data?.msg === "User is not verified") {
            navigate("/verifyemail");
          } else {
            setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
          }
        });
    }
  }, [isLoggedIn, navigate]);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    if (inputEmail === "" || inputPassword === "") {
      setLoading(false);
      setErrMsg("All fields are required.");
      return;
    }
    axios
      .post(
        "/Signin",
        { email: inputEmail, password: inputPassword },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.errMsg) setErrMsg(res.data.errMsg);
        else {
          dispatch(setUserName(res.data.userInfo.userName));
          dispatch(setUserCreditAmount(res.data.userInfo.credits));
          dispatch(setUserLoadAmount(0));
          dispatch(setUserJoinedDate(res.data.userInfo.joinedDate));
          dispatch(setUserEmail(inputEmail));
          dispatch(setUserLoggedIn(true));
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
        if (e?.response?.data?.msg === "Incorrect email or password.") {
          setErrMsg(e.response.data.msg);
        } else
          setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <PageLayout title="Login" hideNavAndFooter>
      <div className="authContainer">
        <div className="authColumn">
          <div className="backToHome">
            <Link to="/" className="link">
              <GoArrowLeft size={18} style={{ marginTop: "2px" }} />
              <p>Return to Home</p>
            </Link>
          </div>
          <div className="authHeader">
            <h1>Login</h1>
            <p>Welcome back! Please enter your details.</p>
          </div>

          {errMsg && <AlertMessage msg={errMsg} type="error" />}
          <form action="POST" className="authFormContainer">
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
                setErrMsg("");
              }}
              placeholder="Password"
              minLength={8}
              maxLength={50}
            />
            <Link to="/forgotpassword" className="linkAlt">
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
