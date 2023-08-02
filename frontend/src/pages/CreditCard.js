import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useSelector } from "react-redux";
import "../styles/Global.css";
import "../styles/Stripe.css";
import axios from "../api/axios";
import CheckoutForm from "../components/CheckoutForm";
import PageLayout from "../components/PageLayout";

export default function CreditCard() {
  const email = useSelector((state) => state.auth.email);

  const [clientSecret, setClientSecret] = useState("");
  const [stripeKey, setstripeKey] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    axios
      .get("/getStripePublicKey")
      .then((res) => {
        if (res) {
          setstripeKey(res.data);
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
      //MAKE SURE TO SEND IN VALUE FROM REDUX FOR AMOUNT THIS IS HARD CODED!!!!!!
      body: JSON.stringify({ amount: "500", email: email }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [email]);

  const stripePromise = loadStripe(stripeKey);

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
            <h1>You're almost done!</h1>
            <p>Please enter your card information below.</p>
          </div>
          {clientSecret && (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm errorMsg={errMsg} useremail={email} />
            </Elements>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
