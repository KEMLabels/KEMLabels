import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiLoader } from "react-icons/fi";
import AlertMessage from "./AlertMessage";
import Button from "./Button";
import {
  setSenderInfo,
  setUserCreditAmount,
} from "../redux/actions/UserAction";
import { courierTypes } from "../content/orderLabelsConstants";
import OrderForm from "./OrderForm";
import SingleOrderSuccess from "./SingleOrderSuccess";
import OrderConfirmPopup from "./OrderConfirmPopup";
import axios from "../api/axios";
import Log from "./Log";

export default function SingleLabelOrder({ setIsBulkOrder }) {
  const dispatch = useDispatch();
  const email = useSelector((state) => state.user.email);
  const senderInfoRedux = useSelector((state) => state.user.senderInfo);
  const creditAmount = useSelector((state) => state.user.creditAmount);
  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);

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
    senderInfo: { ...senderAndRecipientInfo, ...senderInfoRedux },
    recipientInfo: { ...senderAndRecipientInfo },
  };

  const [loading, setLoading] = useState(false);
  const [isFetchingPricing, setIsFetchingPricing] = useState(true);
  const [successMsg, setSuccessMsg] = useState(false);
  const [sectionErrors, setSectionErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [showOrderConfirmPopup, setShowOrderConfirmPopup] = useState(false);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [saveSenderInfo, setSaveSenderInfo] = useState(!!senderInfoRedux);
  const [pricing, setPricing] = useState({});
  const [signatureChecked, setSignatureChecked] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    if (creditAmount === 0 || creditAmount - totalPrice < 0) {
      setSectionErrors({
        container:
          "You have insufficient funds to purchase. Please load your credits first to proceed with your purchase.",
      });
    }
  }, [creditAmount, totalPrice]);

  // Fetch user's sender info on page load
  useEffect(() => {
    if (!isLoggedIn) return;

    axios
      .get("/order/senderInfo", { withCredentials: true })
      .then((res) => {
        if (res.data.errMsg) {
          setSectionErrors({ container: res.data.errMsg });
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          const fetchedSenderInfo = res.data.senderInfo;
          Log("Fetched sender info:", fetchedSenderInfo);
          const senderInfo = {
            firstName: fetchedSenderInfo.name.split(" ")[0],
            lastName: fetchedSenderInfo.name.split(" ")[1],
            phone: fetchedSenderInfo.phone,
            street: fetchedSenderInfo.address1,
            suite: fetchedSenderInfo.address2,
            city: fetchedSenderInfo.city,
            state: fetchedSenderInfo.state,
            zip: fetchedSenderInfo.postal_code,
            country: fetchedSenderInfo.country,
          };
          dispatch(setSenderInfo(senderInfo));
          setFormValues((prev) => ({ ...prev, senderInfo: senderInfo }));
        }
      })
      .catch((e) => {
        Log("Error: ", e);
        setSectionErrors({
          container: "An unexpected error occurred. Please try again later.",
        }); // Axios default error
      });
  }, [dispatch, isLoggedIn]);

  // Fetch user's custom pricing on page load
  useEffect(() => {
    if (!isLoggedIn || !pricing || Object.keys(pricing).length > 0) return;

    axios
      .get("/order/label/pricings", { withCredentials: true })
      .then((res) => {
        if (res.data.errMsg) {
          setSectionErrors({ container: res.data.errMsg });
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          Log("Fetched pricing:", res.data.pricing);
          setPricing(res.data.pricing);
        }
      })
      .catch((e) => {
        Log("Error: ", e);
        setSectionErrors({
          container: "An unexpected error occurred. Please try again later.",
        }); // Axios default error
      })
      .finally(() => setIsFetchingPricing(false));
  }, [pricing, isLoggedIn]);

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
          dispatch(setUserCreditAmount(creditAmount - totalPrice));
          setTimeout(() => {
            setLoading(false);
            setShowOrderConfirmPopup(false);
            setOrderSuccess(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
            document.body.style.overflow = null;
          }, 1000);
        }
      })
      .catch((e) => {
        Log("Error: ", e);
        if (e?.response?.data?.msg === "Insufficient credit balance.") {
          setSectionErrors({
            container:
              "You have insufficient funds to purchase. Please load your credits first to proceed with your purchase.",
          });
          return;
        }
        setSectionErrors({
          container: "An unexpected error occurred. Please try again later.",
        }); // Axios default error
      })
      .finally(() => {
        setLoading(false);
        setShowOrderConfirmPopup(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.body.style.overflow = null;
      });
  }

  return (
    <>
      {showOrderConfirmPopup && (
        <OrderConfirmPopup
          setShowOrderConfirmPopup={setShowOrderConfirmPopup}
          confirmOrder={confirmOrder}
          loading={loading}
        />
      )}
      {orderSuccess ? (
        <SingleOrderSuccess formValues={formValues} />
      ) : (
        <div className="globalContainer orderLabelContainer">
          <div className="headingContainer">
            <h1>Order Single Label</h1>
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
              title="Switch to Bulk Order"
              text="Switch to Bulk Order"
              onClickEvent={() => setIsBulkOrder(true)}
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
        </div>
      )}
    </>
  );
}
