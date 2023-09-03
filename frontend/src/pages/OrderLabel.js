import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import "../styles/Global.css";
import "../styles/OrderLabel.css";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { InputField } from "../components/Field";
import AlertMessage from "../components/AlertMessage";
import Button from "../components/Button";

export default function OrderLabel() {
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const senderAndReceiverInfo = {
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
  const [formValues, setFormValues] = useState({
    courier: "",
    classType: "",
    itemWeight: 0,
    packageInfo: {
      length: 0,
      width: 0,
      height: 0,
      description: "",
      referneceNumber: "",
    },
    senderInfo: { ...senderAndReceiverInfo },
    receiverInfo: { ...senderAndReceiverInfo },
  });
  const [error, setError] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  // Save input value on change
  const saveInput = (e, section = "", field = "") => {
    e.preventDefault();
    if (section === "senderInfo") {
      setError((array) => array.filter((e) => e.label !== "sender"));
    } else if (section === "receiverInfo") {
      setError((array) => array.filter((e) => e.label !== "receiver"));
    }
    setFormValues((prevValues) => {
      if (section) {
        return {
          ...prevValues,
          [section]: {
            ...prevValues[section],
            [field]: e.target.value.trim(),
          },
        };
      }
      return {
        ...prevValues,
        [section]: e.target.value.trim(),
      };
    });
  };

  const isSectionEmpty = (section) => {
    return Object.values(section).some((value) => value === "");
  };

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    const {
      courier,
      classType,
      itemWeight,
      packageInfo,
      senderInfo,
      receiverInfo,
    } = formValues;
    const isSenderInfoEmpty = isSectionEmpty(senderInfo);
    const isReceiverInfoEmpty = isSectionEmpty(receiverInfo);
    const errors = [];

    if (isSenderInfoEmpty) {
      errors.push({
        label: "sender",
        msg: "Please fill out all required fields in this section.",
      });
    }
    if (isReceiverInfoEmpty) {
      errors.push({
        label: "receiver",
        msg: "Please fill out all required fields in this section.",
      });
    }

    if (errors.length > 0) {
      setLoading(false);
      setError(errors);
      return;
    }

    // TODO: axios call here
  };

  return (
    <PageLayout title="Order a Label">
      <div className="globalContainer orderLabelContainer">
        <div className="headingContainer" style={{ textAlign: "center" }}>
          <h1>Order a label</h1>
          <p>
            Please complete all mandatory fields to proceed with placing your
            order.
          </p>
          {error
            .filter((error) => error.label === "container")
            .map((error, i) => (
              <AlertMessage key={i} msg={error.msg} type="error" />
            ))}
        </div>
        <form action="POST" className="orderLabelForm">
          {/* <h2>Shipping label information</h2> */}
          <div id="senderSection" className="formSection">
            <h2>Sender Address</h2>
            {error
              .filter((error) => error.label === "sender")
              .map((error, i) => (
                <AlertMessage key={i} msg={error.msg} type="error" />
              ))}
            <div className="formRow">
              <InputField
                label="First name"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "firstName")}
                placeholder="John"
                minLength={1}
                maxLength={50}
              />
              <InputField
                label="Last name"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "lastName")}
                placeholder="Doe"
                minLength={1}
                maxLength={50}
              />
            </div>
            <div className="formRow">
              <InputField
                label="Company name"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "companyName")}
                maxLength={50}
                optional
              />
              <InputField
                label="Phone number"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "phone")}
                placeholder="(XXX) XXX-XXXX"
                minLength={10}
                maxLength={10}
              />
            </div>
            <div className="formRow">
              <InputField
                label="Street"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "street")}
                placeholder="Start typing your address..."
                minLength={1}
                maxLength={50}
              />
              <InputField
                label="Suite / Apt / Unit"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "suite")}
                minLength={1}
                maxLength={15}
                optional
              />
            </div>
            <div className="formRow">
              <InputField
                label="City"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "city")}
                placeholder="Vancouver"
                minLength={1}
                maxLength={50}
              />
              <InputField
                label="Zip / Postal code"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "zip")}
                placeholder="A1B 2C3"
                minLength={6}
                maxLength={6}
              />
            </div>
            <div className="formRow">
              <InputField
                label="Province / State"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "state")}
                placeholder="British Columbia"
                minLength={1}
                maxLength={50}
              />
              <InputField
                label="Country"
                onChangeEvent={(e) => saveInput(e, "senderInfo", "country")}
                placeholder="Canada"
                minLength={1}
                maxLength={50}
              />
            </div>
          </div>
          <div id="receiverSection" className="formSection">
            <h2>Receiver Address</h2>
            {error
              .filter((error) => error.label === "receiver")
              .map((error, i) => (
                <AlertMessage key={i} msg={error.msg} type="error" />
              ))}
            <div className="formRow">
              <InputField
                label="First name"
                onChangeEvent={(e) => saveInput(e, "receiverInfo", "firstName")}
                placeholder="John"
                minLength={1}
                maxLength={50}
              />
              <InputField
                label="Last name"
                onChangeEvent={(e) => saveInput(e, "receiverInfo", "lastName")}
                placeholder="Doe"
                minLength={1}
                maxLength={50}
              />
            </div>
            <div className="formRow">
              <InputField
                label="Company name"
                onChangeEvent={(e) =>
                  saveInput(e, "receiverInfo", "companyName")
                }
                maxLength={50}
                optional
              />
              <InputField
                label="Phone number"
                onChangeEvent={(e) => saveInput(e, "receiverInfo", "phone")}
                placeholder="(XXX) XXX-XXXX"
                minLength={10}
                maxLength={10}
              />
            </div>
            <div className="formRow">
              <InputField
                label="Street"
                onChangeEvent={(e) => saveInput(e, "receiverInfo", "street")}
                placeholder="Start typing your address..."
                minLength={1}
                maxLength={50}
              />
              <InputField
                label="Suite / Apt / Unit"
                onChangeEvent={(e) => saveInput(e, "receiverInfo", "suite")}
                minLength={1}
                maxLength={15}
                optional
              />
            </div>
            <div className="formRow">
              <InputField
                label="City"
                onChangeEvent={(e) => saveInput(e, "receiverInfo", "city")}
                placeholder="Vancouver"
                minLength={1}
                maxLength={50}
              />
              <InputField
                label="Zip / Postal code"
                onChangeEvent={(e) => saveInput(e, "receiverInfo", "zip")}
                placeholder="A1B 2C3"
                minLength={6}
                maxLength={6}
              />
            </div>
            <div className="formRow">
              <InputField
                label="Province / State"
                onChangeEvent={(e) => saveInput(e, "receiverInfo", "state")}
                placeholder="British Columbia"
                minLength={1}
                maxLength={50}
              />
              <InputField
                label="Country"
                onChangeEvent={(e) => saveInput(e, "receiverInfo", "country")}
                placeholder="Canada"
                minLength={1}
                maxLength={50}
              />
            </div>
          </div>
          <div>
            <Button
              btnType="submit"
              loading={loading}
              onClickEvent={submit}
              text="Submit order"
            />
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
