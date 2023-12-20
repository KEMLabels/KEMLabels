import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/LoadCredits.css";
import "../styles/Stripe.css";
import { FaBitcoin, FaRegCreditCard } from "react-icons/fa";
import { setUserLoadAmount } from "../redux/actions/UserAction";
import axios from "../api/axios";
import { AmountField } from "../components/Field";
import Log from "../components/Log";

export default function LoadCredits() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const isUserVerified = useSelector((state) => state.user.isVerified);

  const [fieldErrors, setFieldErrors] = useState({});
  const [loadAmount, setLoadAmount] = useState("");

  useEffect(() => {
    if (!isUserVerified) navigate("/verify-email");
    if (!isLoggedIn) navigate("/");
    dispatch(setUserLoadAmount(0));
  }, [isLoggedIn, dispatch, navigate, isUserVerified]);

  const handleLoadCredits = (e) => {
    e.preventDefault();
    setFieldErrors({});
    if (!loadAmount || loadAmount < 1) {
      dispatch(setUserLoadAmount(0));
      setFieldErrors({
        loadAmount: "Please enter an amount that is greater than $1.00.",
      });
      return false;
    }
    dispatch(setUserLoadAmount(loadAmount));
    return true;
  };

  return (
    <PageLayout
      title="Load Credits"
      description="Top Up Your Account Balance - Securely add credits to your account with credit/debit cards through Stripe or cryptocurrency through Coinbase. Flexible payment options for your convenience at KEMLabels"
    >
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
          <div className="authHeader center">
            <img
              src="/media/paymentoption.jpg"
              alt="Payment option illustration"
            />
            <h1>How do you want to load?</h1>
            <p>
              <span>
                Please enter the amount to load and choose one of the payment
                options below to get started. If you are looking to refund,
                please contact us at{" "}
              </span>
              <Link className="link" to="mailto:support@kemlabels.com">
                support@kemlabels.com.
              </Link>
            </p>
          </div>

          <div
            className="stripePaymentForm"
            style={{ padding: 0, boxShadow: "none" }}
          >
            <div
              className="stripeFieldGroup"
              style={{ justifyContent: "center", marginBottom: "1.5rem" }}
            >
              <AmountField
                containerClassName="loadAmountField"
                label="Load amount"
                placeholder="0"
                currentValue={loadAmount}
                prefix="$"
                postfix="USD"
                onChangeEvent={(e) => {
                  setLoadAmount(e.target.value);
                }}
                error={fieldErrors?.loadAmount}
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
                      Log("Error: ", e);
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
