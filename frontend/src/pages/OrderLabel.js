import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/OrderLabel.css";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { BsArrowUp } from "react-icons/bs";
import { FiLoader } from "react-icons/fi";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import axios from "../api/axios";
import Log from "../components/Log";
import { setUserCreditAmount } from "../redux/actions/UserAction";
import { courierTypes } from "../content/orderLabelsConstants";
import OrderConfirmPopup from "../components/OrderConfirmPopup";
import OrderSuccess from "../components/OrderSuccess";
import OrderForm from "../components/OrderForm";
import BulkOrder from "../components/BulkOrder";

export default function OrderLabel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const isUserVerified = useSelector((state) => state.user.isVerified);
  const email = useSelector((state) => state.user.email);
  const savedSenderInfo = useSelector((state) => state.user.senderInfo);
  const creditAmount = useSelector((state) => state.user.creditAmount);

  const senderAndRecipientInfo = {
    firstName: "",
    lastName: "",
    phone: "",
    street: "",
    suite: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
  };
  const initialFormValues = {
    courier: courierTypes[0],
    classType: "",
    packageInfo: {
      weight: "",
      length: "",
      width: "",
      height: "",
      description: "",
      referenceNumber: "",
      referenceNumber2: "",
    },
    senderInfo: { ...senderAndRecipientInfo, ...savedSenderInfo },
    recipientInfo: { ...senderAndRecipientInfo },
  };
  const [formValues, setFormValues] = useState(initialFormValues);
  const [sectionErrors, setSectionErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  const [saveSenderInfo, setSaveSenderInfo] = useState(!!savedSenderInfo);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showOrderConfirmPopup, setShowOrderConfirmPopup] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [signatureChecked, setSignatureChecked] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pricing, setPricing] = useState({});
  const [isFetchingPricing, setIsFetchingPricing] = useState(true);
  const [isBulkOrder, setIsBulkOrder] = useState(false);

  useEffect(() => {
    if (!isUserVerified) navigate("/verify-email");
    if (!isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate, isUserVerified]);

  useEffect(() => {
    const scrollHandler = () => setShowFloatingBtn(window.scrollY > 100);
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  useEffect(() => {
    if (creditAmount === 0 || creditAmount - totalPrice < 0) {
      setSectionErrors({
        container:
          "You have insufficient funds to purchase. Please load your credits first to proceed with your purchase.",
      });
    }
  }, [creditAmount, totalPrice]);

  // Fetch user's custom pricing on page load
  useEffect(() => {
    if (!email) return;
    axios
      .get("/order/label/pricings", { withCredentials: true })
      .then((res) => {
        if (res.data.errMsg) {
          setSectionErrors({ container: res.data.errMsg });
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else setPricing(res.data.pricing);
      })
      .catch((e) => {
        Log("Error: ", e);
        setSectionErrors({
          container: "An unexpected error occurred. Please try again later.",
        }); // Axios default error
      })
      .finally(() => setIsFetchingPricing(false));
  }, [email]);

  function trimFormValues() {
    const formValuesCopy = { ...formValues };
    Object.keys(formValuesCopy).forEach((section) => {
      if (section === "courier" || section === "classType") {
        formValuesCopy[section] = formValuesCopy[section].trim();
      } else {
        Object.keys(formValuesCopy[section]).forEach((field) => {
          const value = formValuesCopy[section][field];
          if (typeof value !== "string" && !(value instanceof String)) return;
          formValuesCopy[section][field] = value.trim();
        });
      }
    });
    return formValuesCopy;
  }

  function confirmOrder() {
    setLoading(true);
    const formValues = trimFormValues();
    axios
      .post(
        "/order/label/single",
        {
          email: email,
          formValues: formValues,
          totalPrice: totalPrice,
          signature: signatureChecked,
          isSenderInfoSaved: saveSenderInfo,
        },
        { withCredentials: true }
      )
      .then((res) => {
        if (res.data.errMsg) {
          setSectionErrors({ container: res.data.errMsg });
          setLoading(false);
          setShowOrderConfirmPopup(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
          document.body.style.overflow = null;
        } else {
          setSectionErrors({});
          setSuccessMsg("Your order has been placed. Redirecting...");
          setTimeout(() => {
            setLoading(false);
            setShowOrderConfirmPopup(false);
            dispatch(setUserCreditAmount(creditAmount - totalPrice));
            setOrderSuccess(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
            document.body.style.overflow = null;
          }, 1000);
        }
      })
      .catch((e) => {
        Log("Error: ", e);
        if (e?.response?.data?.msg.startsWith("Error: not enough balance")) {
          setSectionErrors({
            container:
              "You have insufficient funds to purchase. Please load your credits first to proceed with your purchase.",
          });
        } else {
          setSectionErrors({
            container: "An unexpected error occurred. Please try again later.",
          }); // Axios default error
        }
      })
      .finally(() => {
        setLoading(false);
        setShowOrderConfirmPopup(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.body.style.overflow = null;
      });
  }

  return (
    <PageLayout
      title="Order Label"
      description="Order Shipping Labels Online - Quickly generate shipping labels by providing address and package details. Get your label sent to your email for easy printing and shipping. Streamline your shipping process with KEMLabels."
    >
      {showOrderConfirmPopup && (
        <OrderConfirmPopup
          setShowOrderConfirmPopup={setShowOrderConfirmPopup}
          confirmOrder={confirmOrder}
          loading={loading}
        />
      )}
      {orderSuccess ? (
        <OrderSuccess formValues={formValues} />
      ) : (
        <div className="globalContainer orderLabelContainer">
          <div className="headingContainer">
            <h1>Order label</h1>
            <p>
              Please complete all mandatory fields to proceed with placing your
              order.
            </p>
            {sectionErrors?.container && (
              <AlertMessage msg={sectionErrors.container} type="error" />
            )}
            {successMsg && <AlertMessage msg={successMsg} type="success" />}
          </div>
          <div className="orderTotal orderHeader">
            <Button
              fill="outline"
              title={
                isBulkOrder ? "Switch to Single Order" : "Switch to Bulk Order"
              }
              text={
                isBulkOrder ? "Switch to Single Order" : "Switch to Bulk Order"
              }
              onClickEvent={() => setIsBulkOrder((prev) => !prev)}
            />
            <p>
              Order Total: <strong>${totalPrice.toFixed(2)}</strong>
            </p>
          </div>
          {isFetchingPricing ? (
            <div className="loadingContainer">
              <FiLoader className="loading" size={50} />
              <span className="loadingText">Loading...</span>
            </div>
          ) : isBulkOrder ? (
            <BulkOrder
              email={email}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
              setSectionErrors={setSectionErrors}
              setSuccessMsg={setSuccessMsg}
              setOrderSuccess={setOrderSuccess}
            />
          ) : (
            <OrderForm
              pricing={pricing}
              initialFormValues={initialFormValues}
              sectionErrors={sectionErrors}
              setSectionErrors={setSectionErrors}
              formValues={formValues}
              setFormValues={setFormValues}
              saveSenderInfo={saveSenderInfo}
              setSaveSenderInfo={setSaveSenderInfo}
              totalPrice={totalPrice}
              setTotalPrice={setTotalPrice}
              signatureChecked={signatureChecked}
              setSignatureChecked={setSignatureChecked}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
              setShowOrderConfirmPopup={setShowOrderConfirmPopup}
            />
          )}
          <div>
            <Button
              className={`floatingBtn ${showFloatingBtn ? "" : "hidden"}`}
              title="Scroll to top"
              onClickEvent={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
              children={<BsArrowUp size={24} />}
            />
          </div>
        </div>
      )}
    </PageLayout>
  );
}
