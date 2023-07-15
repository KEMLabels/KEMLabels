import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BiErrorCircle } from "react-icons/bi";
import axios from "../api/axios";
import "../styles/Auth.css";
import Navbar from "../components/Navbar";
import Button from "../components/Button";

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
    const res = await axios.post(
      "/Signin",
      { email, password },
      { withCredentials: true }
    );
    console.log(res.data);
    if (res.data.errMsg) seterrMsg(res.data.errMsg);
    else window.location.href = res.data.redirect;
  };

  if (isLoading) return;
  return (
    <div>
      <Navbar />
      <div className="wrapper">
        <div className="authContainer">
          <div className="authColumn">
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
              <input
                type="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                  seterrMsg("");
                }}
                placeholder="Email"
              />
              <input
                type="password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  seterrMsg("");
                }}
                placeholder="Password"
              />
              <Link
                to="/forgotpassword"
                className="linkAlt"
                style={{
                  marginBottom: "3rem",
                }}
              >
                Forgot password?
              </Link>
              <Button btnType="submit" onClickEvent={submit} text="Sign In" />
            </form>
            <div style={{ width: "100%", textAlign: "center" }}>
              <span style={{ opacity: 0.5 }}>Don't have an account? </span>
              <Link to="/signup" className="link">
                Sign Up
              </Link>
            </div>
          </div>
          {/* graphic here */}
          <div className="authColumn"></div>
        </div>
      </div>
    </div>
  );
}
