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

export default function CreditCard() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const email = useSelector((state) => state.auth.email);
  const creditAmount = useSelector((state) => state.auth.creditAmount);

  const [clientSecret, setClientSecret] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [hasStripeKey, SetHasStripeKey] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [loadCreditSuccess, setLoadCreditSuccess] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/");
    axios
      .get("/getStripePublicKey")
      .then((res) => {
        if (res) {
          setStripeKey(res.data);
          SetHasStripeKey(true);
        }
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later.");
      });

    // Create PaymentIntent as soon as the page loads
    fetch("/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        amount: creditAmount.toString() === "0" ? 1 : Number(creditAmount),
      }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [isLoggedIn, email, creditAmount]);

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
    <PageLayout title="Load by Card">
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
          {clientSecret && hasStripeKey && stripeKey && (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm
                errorMsg={errMsg}
                useremail={email}
                setLoadCreditSuccess={setLoadCreditSuccess}
                loadCreditSuccess={loadCreditSuccess}
              />
            </Elements>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
