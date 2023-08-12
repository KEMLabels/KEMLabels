import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/LoadCredits.css";
import "../styles/Stripe.css";
import { FaBitcoin, FaRegCreditCard } from "react-icons/fa";
import { setUserLoadAmount } from "../redux/actions/UserAction";
import axios from "../api/axios";
import AlertMessage from "../components/AlertMessage";
import { StripeAmountField } from "../components/Field";

export default function LoadCredits() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const [errMsg, setErrMsg] = useState("");
  const [loadAmount, setLoadAmount] = useState("");
  const [loadAmountFieldInvalid, setLoadAmountFieldInvalid] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/");
    dispatch(setUserLoadAmount(0));
  }, [isLoggedIn, dispatch, navigate]);

  const handleLoadCredits = (e) => {
    e.preventDefault();
    if (!loadAmount || loadAmount < 1) {
      dispatch(setUserLoadAmount(0));
      setErrMsg("Please enter an amount that is greater than $1.00.");
      setLoadAmountFieldInvalid(true);
      return false;
    }
    dispatch(setUserLoadAmount(loadAmount));
    return true;
  };

  return (
    <PageLayout title="Load Credits">
      <div
        id="loadCredits"
        className="authContainer"
        style={{
          minHeight: "auto",
          justifyContent: "center",
          paddingTop: "5rem",
        }}
      >
        <div
          className="authColumn"
          style={{ width: "100%", maxWidth: "700px" }}
        >
          <div className="authHeader">
            <div style={{ display: "flex", justifyContent: "center" }}>
              <img
                src="/media/paymentoption.jpg"
                alt="Payment option illustration"
                width="100%"
                style={{ maxWidth: "400px" }}
              />
            </div>
            <h1 style={{ textAlign: "center" }}>How do you want to load?</h1>
            <p style={{ opacity: "0.7", textAlign: "center" }}>
              Please enter the amount to load and choose one of the payment
              options below to get started.
            </p>
          </div>

          <div className="stripePaymentForm" id="payment-form">
            {errMsg && <AlertMessage msg={errMsg} type="error" />}
            <div
              className="stripeFieldGroup"
              style={{ justifyContent: "center", marginBottom: "1.5rem" }}
            >
              <StripeAmountField
                containerClassName="loadAmountField"
                fieldType="number"
                label="Load amount"
                placeholder="0"
                currentValue={loadAmount}
                prefix="$"
                postfix="USD"
                onChangeEvent={(e) => {
                  setErrMsg("");
                  setLoadAmountFieldInvalid(false);
                  setLoadAmount(e.target.value);
                }}
                customStyle={
                  loadAmountFieldInvalid ? { border: "2px solid #df1b41" } : {}
                }
              />
            </div>
            <div className="paymentOptionCardGroup">
              <div
                className="paymentOptionCard"
                onClick={(e) => {
                  if (!handleLoadCredits(e)) return;
                  navigate("/pay/credit-card");
                }}
              >
                <p>Credit / Debit Card</p>
                <FaRegCreditCard />
              </div>
              <div
                className="paymentOptionCard"
                onClick={(e) => {
                  if (!handleLoadCredits(e)) return;
                  axios
                    .post(
                      "/payWithCrypto",
                      { amount: loadAmount },
                      { withCredentials: true }
                    )
                    .then((res) => {
                      window.location.href = res.data.redirect;
                    })
                    .catch((e) => {
                      console.log("Error: ", e);
                    });
                }}
              >
                <p>Crypto Currency</p>
                <FaBitcoin />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
