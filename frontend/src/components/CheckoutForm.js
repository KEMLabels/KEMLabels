import React, { useEffect, useRef, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripeInputField } from "./Field";
import AlertMessage from "./AlertMessage";
import Button from "./Button";

export default function CheckoutForm({ useremail, errorMsg }) {
  const stripe = useStripe();
  const elements = useElements();

  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const paymentElementRef = useRef(null);

  useEffect(() => {
    if (errorMsg) setErrMsg(errorMsg);

    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setSuccessMsg("Payment succeeded!");
          break;
        case "processing":
          setInfoMsg("Your payment is processing.");
          break;
        case "requires_payment_method":
          setErrMsg("Your payment was not successful, please try again.");
          break;
        default:
          setErrMsg("Something went wrong.");
          break;
      }
    });
  }, [stripe, errorMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: "http://localhost:3000/webhook/",
        receipt_email: useremail,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      setErrMsg(error.message);
    } else {
      setErrMsg("An unexpected error occurred. Please try again later.");
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs",
  };

  const handleInputChange = () => {
    setErrMsg("");
  };

  return (
    <form
      className="stripePaymentForm"
      id="payment-form"
      onSubmit={handleSubmit}
    >
      {errMsg && <AlertMessage msg={errMsg} type="error" />}
      {infoMsg && <AlertMessage msg={infoMsg} type="info" />}
      {successMsg && <AlertMessage msg={successMsg} type="success" />}

      <StripeInputField
        fieldType="email"
        label="Email"
        disabled
        initialValue={useremail}
        placeholder="Email"
        minLength={3}
        maxLength={100}
      />
      <PaymentElement
        id="payment-element"
        options={paymentElementOptions}
        ref={paymentElementRef}
        onChange={handleInputChange}
      />
      <Button
        btnType="submit"
        id="submit"
        text="Pay now"
        loading={isLoading}
        disabled={isLoading || !stripe || !elements}
        customStyle={{
          padding: "8px 12px",
          borderRadius: "4px",
          width: "100%",
        }}
      />
    </form>
  );
}
