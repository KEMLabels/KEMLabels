import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "../api/axios";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";
import AlertMessage from "../components/AlertMessage";

export default function VerifyEmailConfirmation() {
  const param = useParams();
  const navigate = useNavigate();

  const [fetching, setIsFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [validURL, setvalidURL] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [linkErrMsg, setLinkErrMsg] = useState("");

  useEffect(() => {
    const url = `http://localhost:8081/users/${param.id}/verify/${param.token}`;
    axios
      .get(url, { withCredentials: true })
      .then((res) => {
        console.log(res);
        setvalidURL(true);
      })
      .catch((e) => {
        console.log("Error: ", e);
        setvalidURL(false);
        if (
          e?.response?.data?.msg === "Link Invalid" ||
          e?.response?.data?.msg === "Link Expired"
        ) {
          setLinkErrMsg(e.response.data.msg);
        } else {
          setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
        }
      });
    setTimeout(() => {
      setIsFetching(false);
    }, 500);
  }, [param]);

  function renderErrorHeading() {
    switch (linkErrMsg) {
      case "Link Invalid":
        return (
          <>
            <h1 style={{ textAlign: "center" }}>Your email link is invalid!</h1>{" "}
            <p style={{ opacity: "0.7", textAlign: "center" }}>
              We're sorry, but your email link doesn't seem right. Please{" "}
              <Link to="/verify-email" className="link">
                request a new link here.
              </Link>
            </p>
          </>
        );
      case "Link Expired":
        return (
          <>
            <h1 style={{ textAlign: "center" }}>
              Your email link has expired!
            </h1>{" "}
            <p style={{ opacity: "0.7", textAlign: "center" }}>
              We're sorry, but your email link has expired. Please{" "}
              <Link to="/verify-email" className="link">
                request a new link here.
              </Link>
            </p>
          </>
        );
      default:
        return (
          <>
            <h1 style={{ textAlign: "center" }}>
              Uh oh! Something went wrong.
            </h1>{" "}
            <p style={{ opacity: "0.7", textAlign: "center" }}>
              We're sorry but something went wrong on our server. Please try{" "}
              <Link to="/verify-email" className="link">
                requesting a new link here.
              </Link>
            </p>
          </>
        );
    }
  }

  return (
    <PageLayout title={validURL ? "Email Verified" : `Email ${linkErrMsg}`}>
      <div
        className="authContainer"
        style={{
          minHeight: "auto",
          justifyContent: "center",
          paddingTop: "5rem",
        }}
      >
        {fetching ? null : (
          <div className="authColumn">
            <div className="authHeader">
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                }}
              >
                {validURL ? (
                  <FaCheckCircle size={80} color="#00cc66" />
                ) : (
                  <FaExclamationCircle size={80} color="#ff0033" />
                )}
              </div>
              {validURL ? (
                <>
                  <h1 style={{ textAlign: "center" }}>
                    Your email has been verified!
                  </h1>
                  <p style={{ opacity: "0.7", textAlign: "center" }}>
                    Thank you for confirming your email address! You're all set
                    to begin your purchase.
                  </p>
                </>
              ) : (
                renderErrorHeading()
              )}
            </div>
            {errMsg && <AlertMessage msg={errMsg} type="error" />}
            <Button
              btnType="button"
              text="Return to home"
              loading={loading}
              onClickEvent={() => {
                setLoading(true);
                setTimeout(() => navigate("/"), 100);
              }}
              customStyle={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
