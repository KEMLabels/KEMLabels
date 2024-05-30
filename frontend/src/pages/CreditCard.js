import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useSelector } from "react-redux";
import "../styles/Global.css";
import "../styles/Stripe.css";
import axios from "../api/axios";
import CheckoutForm from "../components/CheckoutForm";
import PageLayout from "../components/PageLayout";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import Log from "../components/Log";
import { isDevelopmentEnv } from "../utils/Helpers";

export default function CreditCard() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const email = useSelector((state) => state.user.email);
  const loadedAmount = useSelector((state) => state.user.loadAmount);
  const creditAmount = useSelector((state) => state.user.creditAmount);
  const isUserVerified = useSelector((state) => state.user.isVerified);
  const stripePublicKey = isDevelopmentEnv()
    ? process.env.REACT_APP_DEV_STRIPE_PUBLIC_KEY
    : process.env.REACT_APP_PROD_STRIPE_PUBLIC_KEY;
  const [clientSecret, setClientSecret] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loadCreditSuccess, setLoadCreditSuccess] = useState(false);
  const [returnHomeBtnLoading, setReturnHomeBtnLoading] = useState(false);
  const [loadAgainBtnLoading, setLoadAgainBtnLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/");
    if (!isUserVerified) navigate("/verify-email");
  }, [isLoggedIn, navigate, isUserVerified]);

  useEffect(() => {
    if (
      !loadCreditSuccess &&
      !clientSecret &&
      (!loadedAmount || loadedAmount === 0)
    ) {
      navigate("/load-credits");
    }
  }, [loadCreditSuccess, loadedAmount, navigate, clientSecret]);

  // Create PaymentIntent on page load
  useEffect(() => {
    if (loadedAmount < 1 || !email) return;
    axios
      .post(
        "/payment/stripe/create",
        {
          email: email,
          amount: Number(loadedAmount) * 100, // Convert to cents
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        Log("response: " + JSON.stringify(res.data));
        // You can access response.data to get the data returned by the server
        setClientSecret(res.data.clientSecret);
      })
      .catch((error) => {
        // Handle errors here
        Log("An error occurred:", error);
        setErrMsg("An error occurred. Please try again later.");
      });
  }, [email, loadedAmount]);

  // Only load stripePromise if stripePublicKey is obtained
  const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;
  const options = {
    clientSecret,
    appearance: {
      theme: "stripe",
    },
  };

  return (
    <PageLayout
      title="Load by Card"
      description="Load Credits to Your Account Securely - Top up your account balance with a credit or debit card using Stripe. Start shipping hassle-free with KEMLabels."
    >
      <div
        className="authContainer"
        style={{
          minHeight: "70vh",
          justifyContent: "center",
          paddingTop: "5rem",
        }}
      >
        <div
          className="authColumn"
          style={{ width: "100%", maxWidth: "700px" }}
        >
          <div className="authHeader center">
            {!loadCreditSuccess ? (
              <>
                <h1>Credit card setup</h1>
                <p>
                  <span>Please enter your card information below.</span>
                </p>
              </>
            ) : (
              <>
                <h1>Credits loaded successfully!</h1>
                <p>
                  <span>
                    Thank you for your payment, we have sent an automated
                    payment receipt to your registered email.
                  </span>
                </p>
              </>
            )}
          </div>
          {!loadCreditSuccess ? (
            clientSecret &&
            stripePublicKey && (
              <Elements options={options} stripe={stripePromise}>
                <CheckoutForm
                  errorMsg={errMsg}
                  setSuccessMsg={setSuccessMsg}
                  useremail={email}
                  setLoadCreditSuccess={setLoadCreditSuccess}
                  loadCreditSuccess={loadCreditSuccess}
                />
              </Elements>
            )
          ) : (
            <div className="stripePaymentForm" id="payment-form">
              {errMsg && <AlertMessage msg={errMsg} type="error" />}
              {successMsg && <AlertMessage msg={successMsg} type="success" />}

              <p className="totalCredsUpdate">
                Your updated total credits is now{" "}
                <strong>${Number(creditAmount).toFixed(2)}.</strong>
              </p>
              <div className="loadSuccessBtnGroup">
                <Button
                  text="Return home"
                  fill="outline"
                  loading={returnHomeBtnLoading}
                  customStyle={{ width: "100%" }}
                  onClickEvent={() => {
                    setReturnHomeBtnLoading(true);
                    setTimeout(() => {
                      navigate("/");
                    }, 100);
                  }}
                />
                <Button
                  text="Load again"
                  loading={loadAgainBtnLoading}
                  customStyle={{ width: "100%" }}
                  onClickEvent={() => {
                    setLoadAgainBtnLoading(true);
                    setTimeout(() => {
                      navigate("/load-credits");
                    }, 100);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
