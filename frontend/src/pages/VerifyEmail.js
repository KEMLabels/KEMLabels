import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axios";
import AlertMessage from "../components/AlertMessage";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";
import { setVerifyEmailAttempts } from "../redux/actions/AuthAction";

function VerifyEmail() {
  const dispatch = useDispatch();
  const [infoMsg, setInfoMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [resentEmail, setResentEmail] = useState(false);
  const email = useSelector((state) => state.auth.email);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const verifyEmailAttemps = useSelector((state) => state.auth.verifyEmailAttemps);

  useEffect(() => {
    if (isLoggedIn) {
      axios.get("/isUserVerified", { withCredentials: true }).then((res) => {
        if (res.data.errMsg) {
          if (res.data.errMsg.startsWith("Please check your inbox")) {
            setInfoMsg(res.data.errMsg);
          } else setErrMsg("An error occured. Please try again later.");
        } else window.location.href = res.data.redirect;
      });
    } else window.location.href = "/";
  }, [isLoggedIn]);

  function resendEmail() {
    // TODO: Resend email POST function
    setErrMsg("Please wait to re-send another email");
    setResentEmail(true);
    if (verifyEmailAttemps === 5) {
      setErrMsg(
        "You have exceeded the maximum number of attempts. Please try again later."
      );
    } else {
      dispatch(setVerifyEmailAttempts(verifyEmailAttemps + 1));
      setTimeout(() => {
        setResentEmail(false);
        setErrMsg("");
      }, 15000);
    }
  }

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
              account. Please check your inbox for a verification link to verify
              your account.
            </p>
          </div>
          {errMsg && <AlertMessage msg={errMsg} type="error" />}
          {infoMsg && <AlertMessage msg={infoMsg} type="info" />}
          <Button
            text="Resend email"
            customStyle={{ width: "100%" }}
            onClickEvent={resendEmail}
            disabled={resentEmail}
          />
          <div
            style={{ textAlign: "center", width: "100%", marginTop: "1.5rem" }}
          >
            <Link to="/" className="link">
              Verify later
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default VerifyEmail;
