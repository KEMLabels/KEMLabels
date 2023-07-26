import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "../components/CheckoutForm";
import "../styles/Stripe.css";
import axios from "../api/axios";

export default function CreditCard() {
  const [clientSecret, setClientSecret] = useState("");
  const [stripeKey, setstripeKey] = useState("");

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
    });

    // Create PaymentIntent as soon as the page loads
    fetch("/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      //MAKE SURE TO SEND IN VALUE FROM REDUX FOR AMOUNT THIS IS HARD CODED!!!!!!
      body: JSON.stringify({ amount: "500"}),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  const stripePromise = loadStripe(stripeKey);

  const appearance = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="Stripe">
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}