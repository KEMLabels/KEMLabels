import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BiErrorCircle } from "react-icons/bi";
import { GoArrowLeft } from "react-icons/go";
import axios from "../api/axios";
import "../styles/Global.css";
import "../styles/Auth.css";
import Button from "../components/Button";
import { InputField, PasswordField } from "../components/Field";
import PageLayout from "../components/PageLayout";

export default function Login() {
  const [isLoading, setIsLoading] = useState(true);
  const [errMsg, seterrMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    axios
      .get("/getSessionInfo", { withCredentials: true })
      .then((res) => {
        if (res.data.isLoggedIn) {
          window.location.href = "/";
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (email === "" || password === "") {
      seterrMsg("All fields are required.");
      return;
    }
      const res = await axios.post(
        "/Signin",
        { email, password },
        { withCredentials: true }
      );
      console.log(res.data);
      if (res.data.errMsg) seterrMsg(res.data.errMsg);
      else {
        localStorage.setItem('isLoggedIn', true);
        window.location.href = res.data.redirect;
      }
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
          {errMsg && (
            <div className="errorMessageContainer">
              <BiErrorCircle size={24} color="#FF0033" />
              <p>{errMsg}</p>
            </div>
          )}
          <form action="POST" className="authFormContainer">
            <InputField
              fieldType="email"
              onChangeEvent={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="Email"
            />
            <PasswordField
              onChangeEvent={(e) => {
                setPassword(e.target.value);
              }}
              placeholder="Password"
            />
            <Link to="/forgotpassword" className="linkAlt">
              Forgot password?
            </Link>
            <Button btnType="submit" onClickEvent={submit} text="Sign in" />
          </form>
          <div style={{ width: "100%", textAlign: "center" }}>
            <span style={{ opacity: 0.5 }}>Don't have an account? </span>
            <Link to="/Signup" className="link">
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
