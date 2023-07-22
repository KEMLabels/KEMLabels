import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "../api/axios";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";

function VerifyEmailConfirmation() {
  const [validURL, setvalidURL] = useState(false);
  const param = useParams();

  useEffect(() => {
    const url = `http://localhost:8081/users/${param.id}/verify/${param.token}`;
    axios
      .get(url, { withCredentials: true })
      .then((res) => {
        console.log(res);
        setvalidURL(true);
      })
      .catch((err) => setvalidURL(false));
  }, [param]);

  return (
    <PageLayout title={validURL ? "Email Verified" : "Email Link Expired"}>
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
                  Thank you for confirming your email address! You're all set to
                  begin your purchase.
                </p>
              </>
            ) : (
              <>
                <h1 style={{ textAlign: "center" }}>
                  Your email link has expired!
                </h1>{" "}
                <p style={{ opacity: "0.7", textAlign: "center" }}>
                  We're sorry, but your email link has expired. Please{" "}
                  <Link to="/verifyemail" className="link">
                    request a new link here.
                  </Link>
                </p>
              </>
            )}
          </div>
          <Button
            btnType="button"
            text="Return to home"
            onClickEvent={() => (window.location.href = "/")}
            customStyle={{ width: "100%" }}
          />
        </div>
      </div>
    </PageLayout>
  );
}

export default VerifyEmailConfirmation;
