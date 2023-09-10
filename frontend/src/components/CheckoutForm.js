import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  setUserCreditAmount,
  setUserLoadAmount,
} from "../redux/actions/UserAction";
import { StripeAmountField, StripeInputField } from "./Field";
import AlertMessage from "./AlertMessage";
import Button from "./Button";
import { Link } from "react-router-dom";
import Log from "./Log";

export default function CheckoutForm({
  useremail,
  errorMsg,
  setSuccessMsg,
  setLoadCreditSuccess,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();

  const creditAmount = useSelector((state) => state.auth.creditAmount);
  const loadedAmount = useSelector((state) => state.auth.loadAmount);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const paymentElementRef = useRef(null);

  useEffect(() => {
    if (errorMsg) setErrMsg(errorMsg);

    if (!stripe || !elements) {
      setIsLoading(true);
      return;
    } else setIsLoading(false);

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    // If URL doesn't contain clientSecret, it means that the user has not made any payment yet
    if (!clientSecret) {
      setIsPageLoading(false);
      return;
    }

    stripe
      .retrievePaymentIntent(clientSecret)
      .then(({ paymentIntent }) => {
        switch (paymentIntent.status) {
          case "succeeded":
            setSuccessMsg("Your credits have been successfully loaded!");
            setLoadCreditSuccess(true);

            // Only update the total credit amount if it has not been updated yet
            const newCreditAmount = Number(creditAmount) + Number(loadedAmount);
            if (newCreditAmount !== creditAmount) {
              dispatch(setUserCreditAmount(newCreditAmount));
              dispatch(setUserLoadAmount(0)); // Reset load amount
            }
            setInfoMsg("");
            setErrMsg("");
            break;
          case "processing":
            setInfoMsg("Your payment is processing. Please wait a moment.");
            setSuccessMsg("");
            setErrMsg("");
            break;
          case "requires_payment_method":
            setErrMsg("Your payment was not successful. Please try again.");
            setSuccessMsg("");
            setInfoMsg("");
            break;
          default:
            setErrMsg("Something went wrong. Please try again.");
            setSuccessMsg("");
            setInfoMsg("");
            break;
        }
        setIsPageLoading(false);
      })
      .catch((e) => {
        Log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      });
  }, [
    stripe,
    elements,
    errorMsg,
    setSuccessMsg,
    creditAmount,
    loadedAmount,
    dispatch,
    setLoadCreditSuccess,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    stripe
      .confirmPayment({
        elements,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: `${process.env.REACT_APP_FRONTEND_SERVER}/pay/credit-card`,
          receipt_email: useremail,
        },
      })
      .then(({ error }) => {
        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        if (error.type === "card_error" || error.type === "validation_error") {
          Log("Error: ", error);
          setErrMsg(error.message);
        } else {
          Log("Error: ", error);
          setErrMsg("An unexpected error occurred. Please try again later.");
        }
      })
      .catch((e) => {
        // Handle any other errors that might occur during the request
        Log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const paymentElementOptions = {
    layout: "tabs",
  };

  if (isPageLoading) return;
  return (
    <form className="stripePaymentForm" id="payment-form">
      {errMsg && (
        <AlertMessage msg={errMsg} type="error" divId="payment-form" />
      )}
      {infoMsg && (
        <AlertMessage msg={infoMsg} type="info" divId="payment-form" />
      )}
      <div className="stripeFieldGroup">
        <StripeInputField
          containerClassName="emailField"
          fieldType="email"
          label="Email"
          disabled
          initialValue={useremail}
          placeholder="Email"
          minLength={3}
          maxLength={100}
        />
        <StripeAmountField
          containerClassName="loadAmountField"
          label="Load amount"
          currentValue={loadedAmount}
          prefix="$"
          postfix="USD"
          disabled
        />
      </div>
      <PaymentElement
        id="payment-element"
        options={paymentElementOptions}
        refs={paymentElementRef}
        onChange={() => setErrMsg("")}
      />
      <Button
        btnType="submit"
        text="Submit"
        loading={isLoading}
        disabled={isLoading || !stripe || !elements}
        onClickEvent={handleSubmit}
        customStyle={{
          padding: "8px 12px",
          borderRadius: "4px",
          width: "100%",
        }}
      />
      <div style={{ textAlign: "center", width: "100%", marginTop: "1rem" }}>
        <Link
          to="/load-credits"
          className="link"
          style={{ color: "#9e9e9e", fontWeight: 400 }}
        >
          Go back
        </Link>
      </div>
    </form>
  );
}
