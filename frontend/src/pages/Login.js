import React, { useEffect, useState } from 'react'
import { Link } from "react-router-dom";
import axios from "../api/axios";
import "../styles/Auth.css";
import Navbar from "../components/Navbar";

function Login() {
  const[isLoading, setIsLoading] = useState(true);
  const [errMsg, seterrMsg] = useState(null);

  useEffect(() => {
    axios.get('/getSessionInfo', { withCredentials: true })
      .then(res => {
        if (res.data.isLoggedIn) {
        window.location.href = '/';
        } else {
          setIsLoading(false);
        }
      })
      .catch(err => console.log(err))
  }, [])


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const res = await axios.post('/Signin', { email, password }, { withCredentials: true });
    console.log(res.data)
    if(res.data.errMsg)
    seterrMsg(res.data.errMsg)
    else
    window.location.href = res.data.redirect;
  }

  if(isLoading) return;
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
              {errMsg && <p>{errMsg}</p>}
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
