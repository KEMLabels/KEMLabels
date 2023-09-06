import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import Button from "../components/Button";

export default function Error() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <PageLayout
      title="Page Not Found"
      description="Oops! Something went wrong. We apologize for the inconvenience. Please return to the home page or contact our support team for assistance."
    >
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
                src="/media/error.jpg"
                alt="Man confused on directions illustration"
                width="100%"
              />
            </div>
            <div className="errorContainer">
              <h1>Oops! Page not found.</h1>
              <p style={{ opacity: 0.7 }}>
                Something went wrong. The page you requested for could not be
                found or does not exist.
              </p>
            </div>
          </div>
          <Button
            btnType="button"
            text="Return to home"
            onClickEvent={() => {
              setLoading(true);
              setTimeout(() => {
                navigate("/");
              }, 100);
            }}
            loading={loading}
            customStyle={{ width: "100%" }}
          />
        </div>
      </div>
    </PageLayout>
  );
}
