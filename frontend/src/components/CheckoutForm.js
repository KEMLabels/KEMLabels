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

export default function CheckoutForm({
  useremail,
  errorMsg,
  loadCreditSuccess,
  setLoadCreditSuccess,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();

  const creditAmount = useSelector((state) => state.auth.creditAmount);
  const loadedAmount = useSelector((state) => state.auth.loadAmount);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [returnHomeBtnLoading, setReturnHomeBtnLoading] = useState(false);
  const [loadAgainBtnLoading, setLoadAgainBtnLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loadAmount, setLoadAmount] = useState("");
  const [loadAmountFieldInvalid, setLoadAmountFieldInvalid] = useState(false);

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
              // TODO: Update the total credits on MongoDB here
              dispatch(setUserCreditAmount(newCreditAmount));
              dispatch(setUserLoadAmount(0)); // Reset load amount
            }
            setInfoMsg("");
            setErrMsg("");
            break;
          case "processing":
            setInfoMsg("Your payment is processing.");
            setSuccessMsg("");
            setErrMsg("");
            break;
          case "requires_payment_method":
            setErrMsg("Your payment was not successful, please try again.");
            setSuccessMsg("");
            setInfoMsg("");
            break;
          default:
            setErrMsg("Something went wrong.");
            setSuccessMsg("");
            setInfoMsg("");
            break;
        }
        setIsPageLoading(false);
      })
      .catch((e) => {
        console.log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      });
  }, [
    stripe,
    elements,
    errorMsg,
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

    if (!loadAmount || loadAmount === 0) {
      dispatch(setUserLoadAmount(0));
      setErrMsg("Please enter a valid amount.");
      setLoadAmountFieldInvalid(true);
      setIsLoading(false);
      return;
    } else dispatch(setUserLoadAmount(loadAmount));

    stripe
      .confirmPayment({
        elements,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: "http://localhost:3000/pay/creditcard", // TODO: Change this to the domain
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
          setErrMsg(error.message);
        } else {
          setErrMsg("An unexpected error occurred. Please try again later.");
        }
      })
      .catch((e) => {
        // Handle any other errors that might occur during the request
        console.log("Error: ", e);
        setErrMsg("An unexpected error occured. Please try again later."); // Axios default error
      });

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs",
  };

  const handleInputChange = () => {
    setErrMsg("");
  };

  if (isPageLoading) return;
  return (
    <form className="stripePaymentForm" id="payment-form">
      {errMsg && <AlertMessage msg={errMsg} type="error" />}
      {infoMsg && <AlertMessage msg={infoMsg} type="info" />}
      {successMsg && <AlertMessage msg={successMsg} type="success" />}
      {!loadCreditSuccess ? (
        <>
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
              fieldType="number"
              label="Load amount"
              placeholder="0"
              currentValue={loadAmount}
              prefix="$"
              postfix="USD"
              onChangeEvent={(e) => {
                handleInputChange();
                setLoadAmountFieldInvalid(false);
                setLoadAmount(e.target.value);
              }}
              customStyle={
                loadAmountFieldInvalid ? { border: "2px solid #df1b41" } : {}
              }
              customContainerStyle={{ width: "35%" }}
            />
          </div>
          <PaymentElement
            id="payment-element"
            options={paymentElementOptions}
            refs={paymentElementRef}
            onChange={handleInputChange}
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
        </>
      ) : (
        <>
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
                  window.location.href = "/";
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
                  window.location.href = "/loadcredits";
                }, 100);
              }}
            />
          </div>
        </>
      )}
    </form>
  );
}
