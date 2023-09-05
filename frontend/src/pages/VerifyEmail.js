import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axios";
import AlertMessage from "../components/AlertMessage";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";
import Log from "../components/Log";

export default function VerifyEmail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const email = useSelector((state) => state.auth.email);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [resentEmail, setResentEmail] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      axios
        .get("/isUserVerified", { withCredentials: true })
        .then((res) => {
          if (res.status === 200) navigate(res.data.redirect);
          else {
            setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
          }
        })
        .catch((e) => {
          Log("Error: ", e);
          if (
            e?.response?.data?.msg ===
            "Please check your inbox for a verification link to verify your account."
          ) {
            setInfoMsg(e.response.data.msg);
          } else {
            setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
          }
        });
    } else navigate("/");
  }, [isLoggedIn, dispatch, navigate]);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrMsg("Please wait a moment to send another email.");
    setResentEmail(true);

    axios
      .get("/generateToken", { withCredentials: true })
      .then((res) => {
        Log(res);
      })
      .catch((e) => {
        Log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      });

    setTimeout(() => {
      setResentEmail(false);
      setLoading(false);
      setErrMsg("");
    }, 15000);
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
            <p style={{ opacity: 1 }}>
              <span style={{ opacity: 0.7 }}>
                You entered <strong>{email}</strong> as the email address for
                your account. Please check your inbox for a verification link to
                verify your account. Please be aware that your account may be{" "}
              </span>
              <strong style={{ color: "#ff0033" }}>
                set for termination within 24 hours
              </strong>{" "}
              <span style={{ opacity: 0.7 }}>
                if you do not complete our verification process.
              </span>
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
