import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axios";
import AlertMessage from "../components/AlertMessage";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";
import { setVerifyEmailAttempts } from "../redux/actions/AuthAction";

export default function VerifyEmail() {
  const dispatch = useDispatch();
  const email = useSelector((state) => state.auth.email);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const verifyEmailState = useSelector((state) => state.auth.verifyEmail);

  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [resentEmail, setResentEmail] = useState(false);

  useEffect(() => {
    if (verifyEmailState && verifyEmailState.lastAttemptDateTime) {
      const currentTime = Date.parse(getCurrentTimeInPST());
      const lastAttemptTime = Date.parse(verifyEmailState.lastAttemptDateTime);
      const timeDifferenceInMinutes = Math.floor(
        Math.abs(currentTime - lastAttemptTime) / 1000 / 60
      );
      // if it has been 3 hours since the last attempt, reset the attempts
      if (timeDifferenceInMinutes >= 180) {
        dispatch(setVerifyEmailAttempts(0, ""));
      }
    }
    if (isLoggedIn) {
      axios
        .get("/isUserVerified", { withCredentials: true })
        .then((res) => {
          if (res.data.errMsg) {
            if (res.data.errMsg.startsWith("Please check your inbox")) {
              setInfoMsg(res.data.errMsg);
            } else setErrMsg("An error occured. Please try again later.");
          } else window.location.href = res.data.redirect;
        })
        .catch((e) => {
          console.log("Error: ", e);
          setErrMsg(`${e.name}: ${e.message}`);
        });
    } else window.location.href = "/";
  }, [isLoggedIn, verifyEmailState, dispatch]);

  function getCurrentTimeInPST() {
    const formatter = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "America/Vancouver",
    });
    return formatter.format(new Date());
  }

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrMsg("Please wait to re-send another email");
    setResentEmail(true);

    if (verifyEmailState.attempts === 10) {
      setLoading(false);
      setErrMsg(
        "You have exceeded the maximum number of attempts. Please try again later."
      );
    } else {
      dispatch(
        setVerifyEmailAttempts(
          verifyEmailState.attempts + 1,
          getCurrentTimeInPST()
        )
      );
      axios
        .get("/generateToken", { withCredentials: true })
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          console.log("Error: ", e);
          setErrMsg(`${e.name}: ${e.message}`);
        })
        .finally(() => {
          setLoading(false);
        });
      setTimeout(() => {
        setResentEmail(false);
        setErrMsg("");
      }, 15000);
    }
  };

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
            btnType="button"
            text="Resend email"
            onClickEvent={submit}
            loading={loading}
            customStyle={{ width: "100%" }}
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
