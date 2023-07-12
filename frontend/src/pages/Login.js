import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../styles/Auth.css";
import Navbar from "../components/Navbar";

function Login() {
  const history = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(e) {
    e.preventDefault();

    try {
      await axios
        .post("http://localhost:8081/Signin", {
          email,
          password,
        })
        .then((res) => {
          if ((res.data = "exists")) {
            history("/");
          } else {
            alert("NOT WORKING!!!");
          }
        })
        .catch((e) => {
          alert("wrong details");
          console.log(e);
        });
    } catch {
      console.log(e);
    }
  }

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
            <form action="POST" className="authFormContainer">
              <input
                type="email"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                placeholder="Email"
              />
              <input
                type="password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                placeholder="Password"
              />
              <Link
                to="/forgotpassword"
                style={{
                  color: "black",
                  textDecoration: "none",
                  marginBottom: "3rem",
                }}
              >
                Forgot password?
              </Link>
              <input type="submit" onClick={submit} value="Sign In" />
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

export default Login;
