import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import AlertMessage from "../components/AlertMessage";
import PageLayout from "../components/PageLayout";
import { useSelector } from "react-redux";
import Button from "../components/Button";

function VerifyEmail() {
  const [infoMsg, setInfoMsg] = useState("");
  const [errMsg, setErrorMsg] = useState("");
  const email = useSelector((state) => state.auth.email);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  useEffect(() => {
    if (isLoggedIn) {
      axios.get("/isUserVerified", { withCredentials: true }).then((res) => {
        if (res.data.errMsg) {
          if (res.data.errMsg === "Please check your inbox for a verification link to verify your account.") {
            setInfoMsg(res.data.errMsg);
          } 
          else setErrorMsg("An error occured. Please try again later.");
        } else window.location.href = res.data.redirect;
      });
    } else window.location.href = "/";
  }, [isLoggedIn, email]);

  return (
    <PageLayout title="Verify Email">
      <div
        className="authContainer"
        style={{
          minHeight: "auto",
          justifyContent: "center",
          paddingTop: "5rem",
        }}
      >
        <div className="authColumn">
          <div className="authHeader">
            <div style={{ display: "flex", justifyContent: "center" }}>
              <img
                src="/media/emailVerify.jpg"
                alt="Verify email illustration"
                width="70%"
              />
            </div>
            <h1>Verify your email address</h1>
            <p style={{ opacity: 0.7 }}>
              You entered <strong>{email}</strong> as the email address for your
              account. Please check your inbox for a verification link to
              verify your account.
            </p>
          </div>
          {errMsg && <AlertMessage msg={errMsg} type="error" />}
          {infoMsg && <AlertMessage msg={infoMsg} type="info" />}
          <Button text="Resend email" customStyle={{ width: "100%" }} />
          <Button text="Verify later" fill="outline" customStyle={{ marginTop: "1rem", width: "100%" }} />
        </div>
      </div>
    </PageLayout>
  );
}

export default VerifyEmail;
