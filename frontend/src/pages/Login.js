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

export default function Login() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [isLoading, setIsLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      axios
        .get("/checkVerification", {
          withCredentials: true,
        })
        .then((res) => {
          if (res.data.errMsg) {
            window.location.href = "/verifyemail";
          } else {
            window.location.href = res.data.redirect;
          }
        })
        .catch((e) => {
          console.log("Error: ", e);
          setErrMsg(`${e.name}: ${e.message}`);
        });
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  const submit = (e) => {
    e.preventDefault();
    if (email === "" || password === "") {
      setErrMsg("All fields are required.");
      return;
    }
    axios
      .post("/Signin", { email, password }, { withCredentials: true })
      .then((res) => {
        console.log(res);
        if (res.data.errMsg) setErrMsg(res.data.errMsg);
        else {
          dispatch(setUserLoggedIn(true));
          dispatch(setUserEmail(email));
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg(`${e.name}: ${e.message}`);
      });
  };

  if (isLoading) return;
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
                setErrMsg("");
              }}
              placeholder="Password"
              minLength={8}
              maxLength={50}
            />
            <Link to="/forgotpassword" className="linkAlt">
              Forgot password?
            </Link>
            <Button btnType="submit" onClickEvent={submit} text="Sign in" />
          </form>
          <div style={{ width: "100%", textAlign: "center" }}>
            <span style={{ opacity: 0.5 }}>Don't have an account? </span>
            <Link to="/signup" className="link">
              Sign Up
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
