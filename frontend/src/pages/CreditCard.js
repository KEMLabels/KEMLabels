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

export default function CreditCard() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const email = useSelector((state) => state.auth.email);
  const loadedAmount = useSelector((state) => state.auth.loadAmount);
  const creditAmount = useSelector((state) => state.auth.creditAmount);
  const isUserVerified = useSelector((state) => state.auth.isVerified);

  const [clientSecret, setClientSecret] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [hasStripeKey, SetHasStripeKey] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loadCreditSuccess, setLoadCreditSuccess] = useState(false);
  const [returnHomeBtnLoading, setReturnHomeBtnLoading] = useState(false);
  const [loadAgainBtnLoading, setLoadAgainBtnLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/");
    if (!isUserVerified) navigate("/verify-email");
    axios
      .get("/getStripePublicKey")
      .then((res) => {
        if (res) {
          setStripeKey(res.data);
          SetHasStripeKey(true);
        }
      })
      .catch((e) => {
        Log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later.");
      });
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
    if (loadedAmount < 1) return;
    axios
      .post(
        "/create-payment-intent",
        {
          email: email,
          amount: Number(loadedAmount),
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
        console.error("An error occurred:", error);
      });
  }, [email, loadedAmount]);

  // Only load stripePromise if stripeKey is obtained
  const stripePromise =
    hasStripeKey && stripeKey ? loadStripe(stripeKey) : null;

  const appearance = {
    theme: "stripe",
  };
  const options = {
    clientSecret,
    appearance,
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
          <div className="authHeader" style={{ textAlign: "center" }}>
            {!loadCreditSuccess ? (
              <>
                <h1>Credit card setup</h1>
                <p>Please enter your card information below.</p>
              </>
            ) : (
              <>
                <h1>Credits loaded successfully!</h1>
                <p>
                  Thank you for your payment, we have sent an automated payment
                  receipt to your registered email.
                </p>
              </>
            )}
          </div>
          {!loadCreditSuccess ? (
            clientSecret &&
            hasStripeKey &&
            stripeKey && (
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
