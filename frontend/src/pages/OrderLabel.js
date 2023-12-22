import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/OrderLabel.css";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { BsArrowUp } from "react-icons/bs";
import { DefaultField, DropdownField, RadioField } from "../components/Field";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";
import Checkbox from "../components/Checkbox";
import Radio from "../components/Radio";
import axios from "../api/axios";
import Log from "../components/Log";
import mockData from "../content/mockOrderData";
import { isDevelopmentEnv } from "../utils/Helpers";
import { setSenderInfo } from "../redux/actions/UserAction";
import { FaCheckCircle } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";

export default function OrderLabel() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const email = useSelector((state) => state.user.email);
  const savedSenderInfo = useSelector((state) => state.user.senderInfo);
  const creditAmount = useSelector((state) => state.user.creditAmount);

  const classTypeItemOptions = [
    "UPS Ground",
    "UPS 2nd Day Air",
    "UPS Next Day Air",
  ];
  const senderAndRecipientInfo = {
    firstName: "",
    lastName: "",
    companyName: "",
    phone: "",
    street: "",
    suite: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  };
  const initialFormValues = {
    courier: "UPS",
    classType: classTypeItemOptions[0],
    packageInfo: {
      weight: "",
      length: "",
      width: "",
      height: "",
      description: "",
      referenceNumber: "",
    },
    senderInfo: { ...senderAndRecipientInfo, ...savedSenderInfo },
    recipientInfo: { ...senderAndRecipientInfo },
  };
  const [formValues, setFormValues] = useState(initialFormValues);
  const [sectionErrors, setSectionErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);
  const [senderInfoChecked, setSenderInfoChecked] = useState(!!savedSenderInfo);
  const [totalAmount, setTotalAmount] = useState(25);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showOrderConfirmationPopup, setShowOrderConfirmationPopup] =
    useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const scrollHandler = () => setShowFloatingBtn(window.scrollY > 100);
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  // Save input value on change
  const saveInput = (e, section, singleValue = false) => {
    if (!singleValue) e.preventDefault();

    // Clear error message if user starts typing
    const errorCopy = { ...sectionErrors };
    if (section === "packageInfo") delete errorCopy["package"];
    else if (section === "recipientInfo") delete errorCopy["recipient"];
    else if (section === "senderInfo") delete errorCopy["sender"];
    setSectionErrors(errorCopy);

    setFormValues((prevValues) => {
      if (!singleValue) {
        return {
          ...prevValues,
          [section]: {
            ...prevValues[section],
            [e.target.name]: e.target.value.trim(),
          },
        };
      }
      return {
        ...prevValues,
        [section]: e.trim(),
      };
    });

    // Update sender info in redux store if user checks the checkbox
    if (senderInfoChecked && section === "senderInfo") {
      dispatch(
        setSenderInfo({
          ...savedSenderInfo,
          [e.target.name]: e.target.value.trim(),
        })
      );
    }
  };

  const isSectionEmpty = (section) => {
    return Object.values(section).some((value) => value === "");
  };

  const submit = (e) => {
    e.preventDefault();

    // Check if user has enough credits, if not, display error message
    if (creditAmount - totalAmount < 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const { courier, classType, packageInfo, senderInfo, recipientInfo } =
      formValues;
    const sections = {
      package: packageInfo,
      sender: senderInfo,
      recipient: recipientInfo,
    };
    const errors = {};

    if (courier === "" || classType === "") {
      errors.courierClass = "Please select a courier and a class type.";
    }

    Object.keys(sections).forEach((sectionName) => {
      if (isSectionEmpty(sections[sectionName])) {
        errors[sectionName] =
          "Please fill out all mandatory fields in this section.";
      }
    });

    if (Object.keys(errors).length > 0) {
      setSectionErrors(errors);
      return;
    }

    // Show confirmation popup
    document.body.style.overflow = "hidden";
    setShowOrderConfirmationPopup(true);
  };

  function submitOrder() {
    setLoading(true);
    // TODO: @Kian axios call here, also SAVE SENDER INFO as a Object to user in DB
    axios
      .post("/OrderLabel", {
        email: email,
        withCredentials: true,
        formValues: formValues,
        totalAmount: totalAmount,
      })
      .then((res) => {
        if (res.data.errMsg) {
          setSectionErrors({ container: res.data.errMsg });
        } else {
          setSectionErrors({});
          setSuccessMsg("Your order has been placed. Redirecting...");
          setTimeout(() => {
            setLoading(false);
            setShowOrderConfirmationPopup(false);
            setOrderSuccess(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
            document.body.style.overflow = null;
          }, 1000);
        }
      })
      .catch((e) => {
        Log("Error: ", e);
        setSectionErrors({
          container: "An unexpected error occured. Please try again later.",
        }); // Axios default error
      });
  }

  function orderSummaryItem(label, value) {
    return (
      <div className="orderSummaryRow">
        <p>{label}</p>
        <p>
          <strong>{value || "N/A"}</strong>
        </p>
      </div>
    );
  }

  function renderContactInfo(title, info) {
    return (
      <>
        <h3>{title}</h3>
        {Object.entries(info).map(([label, value]) =>
          orderSummaryItem(label, value)
        )}
      </>
    );
  }

  function orderSummary() {
    const { courier, classType, packageInfo, senderInfo, recipientInfo } =
      formValues;
    return (
      <div className="orderSummary">
        <h2>Order Summary</h2>
        <div className="orderSummarySection">
          <h3>Courier and Class</h3>
          {orderSummaryItem("Courier", courier)}
          {orderSummaryItem("Class", classType)}
        </div>
        <div className="orderSummarySection">
          <h3>Package Details</h3>
          {Object.entries(packageInfo).map(([label, value]) =>
            orderSummaryItem(label, value)
          )}
        </div>
        <div className="orderSummarySection">
          {renderContactInfo("Sender Information", senderInfo)}
        </div>
        <div className="orderSummarySection">
          {renderContactInfo("Recipient Information", recipientInfo)}
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="Order Label"
      description="Order Shipping Labels Online - Quickly generate shipping labels by providing address and package details. Get your label sent to your email for easy printing and shipping. Streamline your shipping process with KEMLabels."
    >
      {showOrderConfirmationPopup && (
        <div
          className={`orderConfirmationPopup ${
            showOrderConfirmationPopup ? "active" : ""
          }`}
        >
          <div className="popupContainer">
            <IoCloseSharp
              className="closeBtn"
              onClick={() => {
                document.body.style.overflow = null;
                setShowOrderConfirmationPopup(false);
              }}
            />
            <h1>Are you sure?</h1>
            <p>
              Please confirm your order details before submitting. If you are
              sure, click confirm.
            </p>
            <div className="orderConfirmBtnGroup">
              <Button
                text="Cancel"
                fill="outline"
                onClickEvent={() => {
                  document.body.style.overflow = null;
                  setShowOrderConfirmationPopup(false);
                }}
              />
              <Button
                text="Confirm"
                onClickEvent={() => submitOrder()}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}
      {orderSuccess ? (
        <div className="globalContainer orderLabelContainer">
          <div className="headingContainer">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "1.5rem",
              }}
            >
              <FaCheckCircle size={80} color="#00cc66" />
            </div>
            <h1>Thank you for your Order!</h1>
            <p>You will recieve an email of your order details.</p>
          </div>
          {orderSummary()}
        </div>
      ) : (
        <div className="globalContainer orderLabelContainer">
          <div className="headingContainer">
            <h1>Order label</h1>
            <p>
              Please complete all mandatory fields to proceed with placing your
              order.
            </p>
            {creditAmount - totalAmount < 0 && (
              <AlertMessage
                msg="You have insufficient funds to purchase. Please load your credits first to proceed with your purchase."
                type="error"
              />
            )}
            {sectionErrors?.container && (
              <AlertMessage msg={sectionErrors.container} type="error" />
            )}
            {successMsg && <AlertMessage msg={successMsg} type="success" />}
          </div>
          <form action="POST" className="orderLabelForm">
            <div id="courierSection" className="formSection">
              <div className="sectionHeader">
                <h2>Courier and class</h2>
              </div>
              {sectionErrors?.courierClass && (
                <AlertMessage
                  msg={sectionErrors.courierClass}
                  type="error"
                  divId="courierSection"
                />
              )}
              <div className="formRow">
                <RadioField
                  label="Courier Type"
                  fieldInputGroupClassName="orderRadioInputGroup"
                  radioButtons={
                    <>
                      <Radio
                        label="UPS"
                        isSelected={formValues.courier === "UPS"}
                        onRadioChange={() => saveInput("UPS", "courier", true)}
                      />
                      <Radio
                        label="Canada Post"
                        isSelected={formValues.courier === "Canada Post"}
                        onRadioChange={() =>
                          saveInput("Canada Post", "courier", true)
                        }
                      />
                    </>
                  }
                />
                <DropdownField
                  label="Class Type"
                  fullwidth
                  dropdownItemOptions={classTypeItemOptions}
                  onChangeEvent={(e) =>
                    saveInput(e.label.toString(), "classType", true)
                  }
                  value={classTypeItemOptions.find(
                    (option) => option === formValues.classType
                  )}
                />
              </div>
            </div>

            <div id="packageSection" className="formSection">
              <div className="sectionHeader">
                <h2>Package details</h2>
              </div>
              {sectionErrors?.package && (
                <AlertMessage
                  msg={sectionErrors.package}
                  type="error"
                  divId="packageSection"
                />
              )}
              <div className="formRow">
                <DefaultField
                  label="Weight"
                  helpText="Maximum weight is 150 lbs."
                  onChangeEvent={(e) => saveInput(e, "packageInfo")}
                  minLength={1}
                  maxLength={3}
                  name="weight"
                  currentValue={formValues?.packageInfo?.weight}
                  postfix="lbs"
                  shortField
                />
                <DefaultField
                  label="Length"
                  onChangeEvent={(e) => saveInput(e, "packageInfo")}
                  minLength={1}
                  maxLength={3}
                  name="length"
                  currentValue={formValues?.packageInfo?.length}
                  postfix="in"
                  shortField
                  fixTextAlignment
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="Width"
                  onChangeEvent={(e) => saveInput(e, "packageInfo")}
                  minLength={1}
                  maxLength={3}
                  name="width"
                  currentValue={formValues?.packageInfo?.width}
                  postfix="in"
                  shortField
                />
                <DefaultField
                  label="Height"
                  onChangeEvent={(e) => saveInput(e, "packageInfo")}
                  minLength={1}
                  maxLength={3}
                  name="height"
                  currentValue={formValues?.packageInfo?.height}
                  postfix="in"
                  shortField
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="Reference number"
                  helpText="Can be your invoice number found on your order details."
                  onChangeEvent={(e) => saveInput(e, "packageInfo")}
                  minLength={1}
                  maxLength={20}
                  name="referenceNumber"
                  currentValue={formValues?.packageInfo?.referenceNumber}
                  optional
                />
              </div>
              <div className="formRow">
                <DefaultField
                  fieldType="textarea"
                  label="Description"
                  helpText="Any relavent package information."
                  onChangeEvent={(e) => saveInput(e, "packageInfo")}
                  minLength={1}
                  maxLength={100}
                  name="description"
                  currentValue={formValues?.packageInfo?.description}
                  optional
                />
              </div>
            </div>

            <div id="senderSection" className="formSection">
              <div className="sectionHeader">
                <h2>Sender address</h2>
                <Checkbox
                  label="Save"
                  isSelected={senderInfoChecked}
                  onCheckboxChange={() => {
                    setSenderInfoChecked(!senderInfoChecked);
                    dispatch(
                      setSenderInfo(
                        senderInfoChecked ? null : formValues.senderInfo
                      )
                    );
                  }}
                />
              </div>
              {sectionErrors?.sender && (
                <AlertMessage
                  msg={sectionErrors.sender}
                  type="error"
                  divId="senderSection"
                />
              )}
              <div className="formRow">
                <DefaultField
                  label="First name"
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  placeholder="John"
                  minLength={1}
                  maxLength={50}
                  name="firstName"
                  currentValue={formValues?.senderInfo?.firstName}
                />
                <DefaultField
                  label="Last name"
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  placeholder="Doe"
                  minLength={1}
                  maxLength={50}
                  name="lastName"
                  currentValue={formValues?.senderInfo?.lastName}
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="Company name"
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  maxLength={50}
                  name="companyName"
                  currentValue={formValues?.senderInfo?.companyName}
                  fixTextAlignment
                  optional
                />
                <DefaultField
                  label="Phone number"
                  helpText="(XXX) XXX-XXXX."
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  placeholder="(XXX) XXX-XXXX"
                  minLength={10}
                  maxLength={10}
                  name="phone"
                  currentValue={formValues?.senderInfo?.phone}
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="Street"
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  placeholder="Start typing your address..."
                  minLength={1}
                  maxLength={50}
                  name="street"
                  currentValue={formValues?.senderInfo?.street}
                />
                <DefaultField
                  label="Suite / Apt / Unit"
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  minLength={1}
                  maxLength={15}
                  name="suite"
                  currentValue={formValues?.senderInfo?.suite}
                  shortField
                  optional
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="City"
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  placeholder="Vancouver"
                  minLength={1}
                  maxLength={50}
                  name="city"
                  currentValue={formValues?.senderInfo?.city}
                />
                <DefaultField
                  label="Zip / Postal code"
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  minLength={6}
                  maxLength={6}
                  name="zip"
                  currentValue={formValues?.senderInfo?.zip}
                  shortField
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="Province / State"
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  placeholder="British Columbia"
                  minLength={1}
                  maxLength={50}
                  name="state"
                  currentValue={formValues?.senderInfo?.state}
                />
                <DefaultField
                  label="Country"
                  onChangeEvent={(e) => saveInput(e, "senderInfo")}
                  placeholder="Canada"
                  minLength={1}
                  maxLength={50}
                  name="country"
                  currentValue={formValues?.senderInfo?.country}
                />
              </div>
            </div>

            <div id="recipientSection" className="formSection">
              <div className="sectionHeader">
                <h2>Recipient address</h2>
              </div>
              {sectionErrors?.recipient && (
                <AlertMessage
                  msg={sectionErrors.recipient}
                  type="error"
                  divId="recipientSection"
                />
              )}
              <div className="formRow">
                <DefaultField
                  label="First name"
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  placeholder="John"
                  minLength={1}
                  maxLength={50}
                  name="firstName"
                  currentValue={formValues?.recipientInfo?.firstName}
                />
                <DefaultField
                  label="Last name"
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  placeholder="Doe"
                  minLength={1}
                  maxLength={50}
                  name="lastName"
                  currentValue={formValues?.recipientInfo?.lastName}
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="Company name"
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  maxLength={50}
                  name="companyName"
                  currentValue={formValues?.recipientInfo?.companyName}
                  fixTextAlignment
                  optional
                />
                <DefaultField
                  label="Phone number"
                  helpText="(XXX) XXX-XXXX."
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  placeholder="(XXX) XXX-XXXX"
                  minLength={10}
                  maxLength={10}
                  name="phone"
                  currentValue={formValues?.recipientInfo?.phone}
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="Street"
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  placeholder="Start typing your address..."
                  minLength={1}
                  maxLength={50}
                  name="street"
                  currentValue={formValues?.recipientInfo?.street}
                />
                <DefaultField
                  label="Suite / Apt / Unit"
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  minLength={1}
                  maxLength={15}
                  name="suite"
                  currentValue={formValues?.recipientInfo?.suite}
                  shortField
                  optional
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="City"
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  placeholder="Vancouver"
                  minLength={1}
                  maxLength={50}
                  name="city"
                  currentValue={formValues?.recipientInfo?.city}
                />
                <DefaultField
                  label="Zip / Postal code"
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  minLength={6}
                  maxLength={6}
                  name="zip"
                  currentValue={formValues?.recipientInfo?.zip}
                  shortField
                />
              </div>
              <div className="formRow">
                <DefaultField
                  label="Province / State"
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  placeholder="British Columbia"
                  minLength={1}
                  maxLength={50}
                  name="state"
                  currentValue={formValues?.recipientInfo?.state}
                />
                <DefaultField
                  label="Country"
                  onChangeEvent={(e) => saveInput(e, "recipientInfo")}
                  placeholder="Canada"
                  minLength={1}
                  maxLength={50}
                  name="country"
                  currentValue={formValues?.recipientInfo?.country}
                />
              </div>
            </div>
            <div className="orderFooter">
              <div className="orderTotal">
                <p>
                  {/* TODO: Hardcoded total */}
                  Total: <strong>${totalAmount.toFixed(2)}</strong> ($25.00 per
                  label)
                </p>
              </div>
              <div className="btnContainer">
                {isDevelopmentEnv() && (
                  <Button
                    fill="outline"
                    text="Autofill"
                    onClickEvent={() => setFormValues(mockData)}
                  />
                )}
                <Button
                  fill="outline"
                  onClickEvent={() => setFormValues(initialFormValues)}
                  text="Clear form"
                />
                <Button
                  btnType="submit"
                  onClickEvent={submit}
                  text="Submit order"
                />
              </div>
            </div>
          </form>
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
