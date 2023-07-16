import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BiErrorCircle } from "react-icons/bi";
import { GoArrowLeft } from "react-icons/go";
import axios from "../api/axios.js";
import "../styles/Global.css";
import "../styles/Auth.css";
import Button from "../components/Button";
import { InputField, PasswordField } from "../components/Field";
import PageLayout from "../components/PageLayout.js";

export default function Signup() {
  const [isLoading, setIsLoading] = useState(true);
  const [errMsg, seterrMsg] = useState("");
  const [userName, setUserName] = useState("");
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
      "/Signup",
      { userName, email, password },
      { withCredentials: true }
    );
    if (res.data.errMsg) seterrMsg(res.data.errMsg);
    else window.location.href = res.data.redirect;
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
          {errMsg && (
            <div className="errorMessageContainer">
              <BiErrorCircle size={24} color="#FF0033" />
              <p>{errMsg}</p>
            </div>
          )}
          <form action="POST" className="authFormContainer">
            <InputField
              onChangeEvent={(e) => {
                setUserName(e.target.value);
                seterrMsg("");
              }}
              placeholder="Username"
            />
            <InputField
              fieldType="email"
              onChangeEvent={(e) => {
                setEmail(e.target.value);
                seterrMsg("");
              }}
              placeholder="Email"
            />
            <PasswordField
              onChangeEvent={(e) => {
                setPassword(e.target.value);
                seterrMsg("");
              }}
              placeholder="Password"
            />
            <Button
              btnType="submit"
              onClickEvent={submit}
              text="Create account"
              customStyle={{ marginTop: "3rem" }}
            />
          </form>
          <div style={{ width: "100%", textAlign: "center" }}>
            <span style={{ opacity: 0.5 }}>Already have an account? </span>
            <Link to="/signin" className="link">
              Sign In
            </Link>
          </div>
        </div>
        {/* graphic here */}
        <div className="authColumn"></div>
      </div>
    </PageLayout>
  );
}
